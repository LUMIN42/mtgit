/**
 * Registry of the supported query keywords (`t:`, `mv>=`, `c:`, ...): their spellings, allowed operators
 * and how their values are read. This is the only place that knows the query syntax of a field.
 *
 * Each keyword turns a clause like `mv>=3` into a tree leaf ({@link CardPredicate}), e.g.
 * `{field: "manaValue", comparison: ">=", value: 3}`. What the leaf means for a card is decided by the evaluators.
 *
 * To add a keyword: add its predicate to `ast.ts`, its definition to {@link FIELD_DEFINITIONS} below,
 * and a matching function to both evaluators (the type checker points out missing ones).
 */

import type {
  CardPredicate,
  ColorField,
  ColorTarget,
  Comparison,
  NumberField,
  QueryOperator,
  Rarity,
  TextField
} from "./ast.js";
import {isQueryColor, RARITIES} from "./ast.js";
import {COLOR_NAME_TO_CODE, ColorNameSchema, MAIN_CARD_TYPES} from "../cards.js";

/**
 * Outcome of reading one clause: either the tree leaf,
 * or a warning for the user explaining why the clause was ignored.
 */
export type FieldParseResult =
  | {ok: true, predicate: CardPredicate}
  | {ok: false, warning: string};

/**
 * How one query keyword is written and read.
 */
interface FieldDefinition {
  /** Lowercase spellings of the keyword, e.g. `["type", "t"]`. */
  aliases: readonly string[];

  /**
   * Reads the rest of a clause into a tree leaf.
   *
   * @param operator the operator as written, `:` means the keyword's default comparison
   * @param value the value with quotes already removed, e.g. `draw a card` for `o:"draw a card"`
   * @param keyword the keyword as the user wrote it, used in warnings
   */
  parse: (operator: QueryOperator, value: string, keyword: string) => FieldParseResult;
}

/**
 * Keywords that do not filter cards but change how results are shown, e.g. `order:rec`.
 * The parser collects them into {@link ParsedCardQuery.directives} instead of the tree.
 */
export const DIRECTIVE_KEYWORDS = ["order", "unique", "prefer", "direction", "display", "include", "lang"] as const;

/** Card types usable as `is:<type>`, e.g. `is:creature`. */
const IS_TYPES = new Set(MAIN_CARD_TYPES.map(type => type.toLowerCase()));

/** Accepted rarity spellings: full names (`rare`) and scryfall's one-letter forms (`r`). */
const RARITY_ALIASES: Record<string, Rarity> = {
  c: "common",
  u: "uncommon",
  r: "rare",
  s: "special",
  m: "mythic",
  b: "bonus",
  ...Object.fromEntries(RARITIES.map(rarity => [rarity, rarity]))
};

/** Shorthand for a successfully read clause. */
function ok(predicate: CardPredicate): FieldParseResult {
  return {ok: true, predicate};
}

/** Shorthand for an ignored clause, the warning is shown to the user. */
function fail(warning: string): FieldParseResult {
  return {ok: false, warning};
}

/** Warning for an operator the keyword does not support, e.g. `t>creature`. */
function unsupportedOperator(keyword: string, operator: QueryOperator): FieldParseResult {
  return fail(`Operator '${operator}' is not supported for '${keyword}', the clause was ignored.`);
}

/**
 * Replaces `:` by what it means for a keyword, other operators are kept as they are.
 * E.g. `mv:3` means `mv=3`, but `c:rg` means `c>=rg` (at least red and green).
 */
function resolveComparison(operator: QueryOperator, defaultComparison: Comparison): Comparison {
  return operator === ":" ? defaultComparison : operator;
}

/**
 * A keyword that searches text, e.g. `t:creature` matches cards whose type line contains "creature".
 * Only `:` and `=` are allowed, both mean "contains".
 */
function textField(field: TextField, aliases: string[]): FieldDefinition {
  return {
    aliases,
    parse: (operator, value, keyword) => {
      if (operator !== ":" && operator !== "=") {
        return unsupportedOperator(keyword, operator);
      }

      return ok({field, value});
    }
  };
}

/**
 * A keyword compared as a number with any operator, e.g. `mv>=3` or `usd<1`. `:` means `=`.
 */
function numberField(field: NumberField, aliases: string[]): FieldDefinition {
  return {
    aliases,
    parse: (operator, value, keyword) => {
      const number = Number(value);

      // Number("") is 0, so an empty value has to be rejected explicitly
      if (value.trim() === "" || !Number.isFinite(number)) {
        return fail(`'${value}' is not a number for '${keyword}', the clause was ignored.`);
      }

      return ok({field, comparison: resolveComparison(operator, "="), value: number});
    }
  };
}

/**
 * Reads the value of a color keyword (`c:` or `id:`) in any of the forms scryfall allows:
 * - `c` / `colorless`: no colors (`:` means exactly none)
 * - `m` / `multicolor`: more than one color (only with `:`)
 * - a number like `2`: that many colors (`:` means exactly)
 * - a color name like `red`, or color letters like `rg`: compared as a set of colors (`:` means `defaultComparison`)
 *
 * @param defaultComparison what `:` means for color sets, see {@link colorField}
 * @returns the comparison and what to compare with, or null if the value is not a color
 */
function parseColorTarget(
  operator: QueryOperator,
  rawValue: string,
  defaultComparison: Comparison
): {comparison: Comparison, target: ColorTarget} | null {
  const value = rawValue.toLowerCase();

  if (value === "c" || value === "colorless") {
    return {comparison: resolveComparison(operator, "="), target: {kind: "count", count: 0}};
  }

  if (value === "m" || value === "multicolor") {
    return operator === ":" ? {comparison: ">", target: {kind: "count", count: 1}} : null;
  }

  if (/^\d+$/.test(value)) {
    return {comparison: resolveComparison(operator, "="), target: {kind: "count", count: Number(value)}};
  }

  // a color name like "red", colorless was handled above
  const colorName = ColorNameSchema.safeParse(value);
  if (colorName.success) {
    const code = COLOR_NAME_TO_CODE[colorName.data];

    if (isQueryColor(code)) {
      return {comparison: resolveComparison(operator, defaultComparison), target: {kind: "set", colors: [code]}};
    }
  }

  // color letters like "rg", duplicates like "rr" are merged
  const letters = [...new Set(value.toUpperCase())];
  if (letters.length > 0 && letters.every(isQueryColor)) {
    return {
      comparison: resolveComparison(operator, defaultComparison),
      target: {kind: "set", colors: letters}
    };
  }

  return null;
}

/**
 * A keyword comparing a card's colors (`c:`) or color identity (`id:`), see {@link parseColorTarget} for the values.
 *
 * @param defaultComparison what `:` means for a set of colors. Scryfall uses `>=` for colors
 * (`c:rg` = at least red and green) and `<=` for identity (`id:rg` = fits into a red-green deck)
 */
function colorField(field: ColorField, aliases: string[], defaultComparison: Comparison): FieldDefinition {
  return {
    aliases,
    parse: (operator, value, keyword) => {
      const parsed = parseColorTarget(operator, value, defaultComparison);

      if (!parsed) {
        return fail(`'${value}' is not a valid color for '${keyword}', the clause was ignored.`);
      }

      return ok({field, ...parsed});
    }
  };
}

/**
 * All supported keywords. Each alias may appear in only one definition.
 */
const FIELD_DEFINITIONS: readonly FieldDefinition[] = [
  textField("name", ["name", "n"]),
  textField("type", ["type", "t"]),
  textField("oracle", ["oracle", "o"]),
  // deck tags, only the frontend can evaluate them
  textField("tag", ["tag", "tags"]),

  numberField("manaValue", ["manavalue", "mv", "cmc"]),
  numberField("usd", ["usd"]),
  numberField("power", ["power", "pow"]),
  numberField("toughness", ["toughness", "tou"]),

  colorField("color", ["color", "colors", "c"], ">="),
  colorField("identity", ["identity", "id", "ci", "commander", "cmd"], "<="),

  // `r:rare`, `r>=rare`, ..., ordered as in RARITIES
  {
    aliases: ["rarity", "r"],
    parse: (operator, value, keyword) => {
      const rarity = RARITY_ALIASES[value.toLowerCase()];

      if (!rarity) {
        return fail(`'${value}' is not a rarity for '${keyword}', the clause was ignored.`);
      }

      return ok({field: "rarity", comparison: resolveComparison(operator, "="), rarity});
    }
  },

  // `f:commander`: legal (or restricted) in the format
  {
    aliases: ["format", "f", "legal"],
    parse: (operator, value, keyword) => {
      const format = value.toLowerCase();

      if (operator !== ":" && operator !== "=") {
        return unsupportedOperator(keyword, operator);
      }

      // formats are used as document keys by backends, so only plain names are allowed
      if (!/^[a-z0-9]+$/.test(format)) {
        return fail(`'${value}' is not a format for '${keyword}', the clause was ignored.`);
      }

      return ok({field: "format", format});
    }
  },

  // `is:` is a shorthand for other keywords, so evaluators need nothing extra for it:
  // `is:multicolor`/`is:mono`/`is:colorless` compare the color identity, `is:legendary`/`is:creature` the type line
  {
    aliases: ["is"],
    parse: (operator, rawValue, keyword) => {
      const value = rawValue.toLowerCase();

      if (operator !== ":" && operator !== "=") {
        return unsupportedOperator(keyword, operator);
      }

      if (value === "multicolor") {
        return ok({field: "identity", comparison: ">", target: {kind: "count", count: 1}});
      }

      if (value === "monocolor" || value === "mono") {
        return ok({field: "identity", comparison: "=", target: {kind: "count", count: 1}});
      }

      if (value === "colorless") {
        return ok({field: "identity", comparison: "=", target: {kind: "count", count: 0}});
      }

      if (value === "legendary" || IS_TYPES.has(value)) {
        return ok({field: "type", value});
      }

      return fail(`'is:${rawValue}' is not supported, the clause was ignored.`);
    }
  }
];

/** Lookup from every alias to its definition, e.g. `"t"` and `"type"` both lead to the type definition. */
const FIELD_BY_ALIAS = new Map<string, FieldDefinition>(
  FIELD_DEFINITIONS.flatMap(definition => definition.aliases.map(alias => [alias, definition] as const))
);

/**
 * @returns the definition for a query keyword (case-insensitive), or undefined if it is not supported.
 */
export function findFieldDefinition(keyword: string): FieldDefinition | undefined {
  return FIELD_BY_ALIAS.get(keyword.toLowerCase());
}

/**
 * @returns whether the keyword is a directive like `order` (case-insensitive), see {@link DIRECTIVE_KEYWORDS}.
 */
export function isDirectiveKeyword(keyword: string): boolean {
  return (DIRECTIVE_KEYWORDS as readonly string[]).includes(keyword.toLowerCase());
}

/**
 * Bare words (without a keyword), e.g. `sol` or `"black lotus"`, search card names like on scryfall.
 */
export function bareWordPredicate(value: string): CardPredicate {
  return {field: "name", value};
}
