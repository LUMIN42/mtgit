/**
 * Turns a scryfall-like query string into a tree ({@link CardQuery}) that backends can evaluate.
 * Supports a basic subset of https://scryfall.com/docs/syntax.
 *
 * How a query is read, from loosest to tightest binding:
 * - `or` splits the query into alternatives: `t:elf t:druid or t:goblin` is `(t:elf AND t:druid) OR t:goblin`.
 * - Clauses next to each other are combined with AND, an explicit `and` is allowed but not needed.
 * - `-` negates the clause or parenthesized group right after it: `-(c:r or c:g)`.
 * - Parentheses group anything: `(t:elf or t:goblin) mv<=2`.
 * - A single clause is either `keyword operator value` (`mv>=3`, `o:"draw a card"`) or a bare word (`sol`),
 *   which searches card names.
 *
 * The same rules as a grammar (each rule is one method of {@link Parser}):
 *   query   := or
 *   or      := and ("or" and)*
 *   and     := unary (["and"] unary)*
 *   unary   := "-" unary | "(" or ")" | term
 *   term    := keyword operator value | value
 *
 * Parsing never fails: unsupported or malformed parts are dropped and reported as warnings,
 * so a query that works on scryfall still gives sensible results here.
 */

import type {CardQuery, ParsedCardQuery, QueryOperator} from "./ast.js";
import {QUERY_OPERATORS} from "./ast.js";
import {bareWordPredicate, findFieldDefinition, isDirectiveKeyword} from "./fields.js";
import type {QueryToken} from "./tokenizer.js";
import {tokenize, unquote} from "./tokenizer.js";

/**
 * Regex alternatives of all operators, e.g. `:|!=|>=|...`.
 * Two-character operators come first in {@link QUERY_OPERATORS}, so `>=` is not read as `>` followed by `=3`.
 */
const OPERATOR_PATTERN = QUERY_OPERATORS
  .map(operator => operator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

/**
 * Splits a clause like `mv>=3` into keyword (`mv`), operator (`>=`) and the rest (`3`).
 * Terms not matching it (e.g. `sol`, `"black lotus"`) are bare words.
 */
const CLAUSE_PATTERN = new RegExp(`^([a-z]+)(${OPERATOR_PATTERN})(.*)$`, "is");

/**
 * Joins parsed parts into one AND or OR node.
 *
 * Parts that were ignored (null) are dropped, a single remaining part is returned as is (no one-child nodes),
 * and nested nodes of the same kind are merged, so `a and (b and c)` becomes one AND with three children.
 *
 * @returns the combined node, or null when nothing remained
 */
function combine(kind: "and" | "or", children: (CardQuery | null)[]): CardQuery | null {
  const present = children.filter((child): child is CardQuery => child !== null);

  if (present.length <= 1) {
    return present[0] ?? null;
  }

  return {
    kind,
    children: present.flatMap(child => child.kind === kind ? child.children : [child])
  };
}

/**
 * Reads tokens left to right, one method per grammar rule (see the file comment).
 * Each method consumes the tokens of its part of the query and returns its tree,
 * or null when the part contained nothing usable.
 *
 * Single use: create one per query, call {@link parse} once, then read {@link directives} and {@link warnings}.
 */
class Parser {
  /** Index of the next token to read. */
  private position = 0;

  /**
   * Keywords that do not filter cards, e.g. `{order: "rec"}` for `order:rec`.
   * When a keyword appears twice, the last one wins.
   */
  readonly directives: Record<string, string> = {};

  /** Notes about ignored parts of the query, meant to be shown to the user. */
  readonly warnings: string[] = [];

  constructor(private readonly tokens: QueryToken[]) {}

  /**
   * Parses the whole query.
   *
   * @returns the filter tree, or null when the query puts no restriction on cards
   */
  parse(): CardQuery | null {
    let result = this.parseOr();

    // parseOr only stops early at a ')' without a matching '(', skip it and continue with the rest
    while (this.position < this.tokens.length) {
      this.warnings.push("Unmatched ')' was ignored.");
      this.position++;
      result = combine("and", [result, this.parseOr()]);
    }

    return result;
  }

  /**
   * @returns the next token without consuming it, undefined at the end of the query
   */
  private peek(): QueryToken | undefined {
    return this.tokens[this.position];
  }

  /**
   * Reads alternatives separated by `or`, e.g. `t:elf or t:goblin`.
   * Stops at a `)` or at the end of the query.
   */
  private parseOr(): CardQuery | null {
    const children = [this.parseAnd()];

    while (this.peek()?.type === "or") {
      this.position++;
      children.push(this.parseAnd());
    }

    return combine("or", children);
  }

  /**
   * Reads clauses that must all hold, e.g. `t:creature mv<=2`.
   * Stops at an `or` (which belongs to {@link parseOr}), a `)` or the end of the query.
   */
  private parseAnd(): CardQuery | null {
    const children: (CardQuery | null)[] = [];

    for (let token = this.peek(); token && token.type !== "or" && token.type !== "rparen"; token = this.peek()) {
      // `and` is implied between clauses, so an explicit one is just skipped
      if (token.type === "and") {
        this.position++;
        continue;
      }

      children.push(this.parseUnary());
    }

    return combine("and", children);
  }

  /**
   * Reads one negated part (`-...`), parenthesized group (`(...)`) or single clause.
   */
  private parseUnary(): CardQuery | null {
    const token = this.peek();
    this.position++;

    switch (token?.type) {
      case "not": {
        const child = this.parseUnary();
        // negating an ignored clause ignores the negation too
        return child && {kind: "not", child};
      }

      case "lparen": {
        const inner = this.parseOr();

        if (this.peek()?.type === "rparen") {
          this.position++;
        }
        else {
          this.warnings.push("Missing ')' was assumed at the end of the query.");
        }

        return inner;
      }

      case "term":
        return this.parseTerm(token.text);

      // a stray `or`/`and` in an unexpected place, e.g. `-or`
      default:
        return null;
    }
  }

  /**
   * Reads a single clause like `mv>=3`, `o:"draw a card"` or a bare word like `sol`.
   *
   * Directives (`order:rec`) are stored in {@link directives} instead of becoming part of the tree.
   * Unknown keywords and invalid values are ignored with a warning.
   * What a keyword's value means is decided by its definition in `fields.ts`.
   *
   * @param text the raw term from the tokenizer, still with its quotes
   * @returns the clause as a tree leaf, or null if it does not filter cards
   */
  private parseTerm(text: string): CardQuery | null {
    const match = CLAUSE_PATTERN.exec(text);

    if (!match) {
      const value = unquote(text);
      return value ? {kind: "predicate", predicate: bareWordPredicate(value)} : null;
    }

    const [, keyword, operator, rawValue] = match;
    const value = unquote(rawValue);

    if (isDirectiveKeyword(keyword)) {
      this.directives[keyword.toLowerCase()] = value.toLowerCase();
      return null;
    }

    const definition = findFieldDefinition(keyword);

    if (!definition) {
      this.warnings.push(`Unsupported keyword '${keyword}', the clause was ignored.`);
      return null;
    }

    const result = definition.parse(operator as QueryOperator, value, keyword);

    if (!result.ok) {
      this.warnings.push(result.warning);
      return null;
    }

    return {kind: "predicate", predicate: result.predicate};
  }
}

/**
 * Parses a scryfall-like query into a tree that does not depend on where cards are stored.
 * The API turns the tree into a mongo filter, the frontend checks loaded cards against it.
 *
 * @example
 * parseCardQuery("t:creature mv<=2 order:rec")
 * // filter: AND(type contains "creature", mana value <= 2)
 * // directives: {order: "rec"}
 * // warnings: []
 */
export function parseCardQuery(query: string): ParsedCardQuery {
  const parser = new Parser(tokenize(query));
  const filter = parser.parse();

  return {
    filter,
    directives: parser.directives,
    warnings: parser.warnings
  };
}
