import type {Deck} from "../types/deck.ts";
import type {ScryfallOracleCard} from "../types/scryfall";

// todo move file to shared code

// todo handle invalid syntax with a warning

type ComparisonOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | ":";

interface ParsedClause {
  negated: boolean;
  field: string | null;
  operator: ComparisonOperator;
  value: string;
}

const COLOR_SYMBOLS = new Set(["w", "u", "b", "r", "g", "c"]);

// todo add to global type declarations and unify
const MAIN_TYPE_KEYWORDS = new Set([
  "artifact",
  "battle",
  "creature",
  "dungeon",
  "enchantment",
  "instant",
  "land",
  "planeswalker",
  "sorcery",
]);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

// todo handle **or** clauses
/**
 * Splits the string s. t. each item is a string containing a single clause.
 * a clause is E.g. '-oracle:"foo \"bar\""' without the outer ''
 */
function splitClauses(query: string): string[] {
  const tokens: string[] = [];

  let buffer = "";

  // whether we are inside quotes, where spaces are preserved
  let inQuotes = false;

  // whether previous character was an escape character "\"
  let escaped = false;

  for (const char of query.trim()) {
    // if previous character was escape, take this character literally
    if (escaped) {
      buffer += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (/\s/.test(char) && !inQuotes) {
      if (buffer.length > 0) {
        tokens.push(buffer);
        buffer = "";
      }
      continue;
    }

    buffer += char;
  }

  // final flush
  if (buffer.length > 0) {
    tokens.push(buffer);
  }

  return tokens;
}

function parseClause(clauseString: string): ParsedClause {
  const negated = clauseString.startsWith("-");
  const trimmedToken = negated ? clauseString.slice(1) : clauseString;
  const match = trimmedToken.match(/^([a-z][a-z0-9_]*)(:|!=|>=|<=|=|>|<)(.+)$/i);

  if (!match) {
    return {
      negated,
      field: null,
      operator: ":",
      value: trimmedToken,
    };
  }

  return {
    negated,
    field: match[1].toLowerCase(),
    operator: match[2] as ComparisonOperator,
    value: match[3].trim(),
  };
}

function getFaceSearchText(card: ScryfallOracleCard): string {
  return card.card_faces
    ?.map((face) => [face.name, face.type_line, face.oracle_text ?? ""].join(" "))
    .join(" ") ?? "";
}

function matchesText(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

/**
 * @param rangeExpression e.g. "2..3" ~ match number from 2 to 3 inclusive
 * @param value value, for which we are checking, whether it falls within range
 */
function matchesRange(value: number, rangeExpression: string): boolean {
  const [lowerRaw, upperRaw] = rangeExpression.split("..", 2);
  const lower = Number.parseFloat(lowerRaw);
  const upper = Number.parseFloat(upperRaw);

  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return false;
  }

  return value >= lower && value <= upper;
}

/**
 * Evaluates whether a numeric (or numeric-like) value matches a query using
 * either comparison operators or range syntax.
 *
 * The function supports:
 * - Direct numeric comparisons using operators (`=`, `!=`, `>`, `>=`, `<`, `<=`)
 * - Range expressions using `"min..max"` syntax
 * - Fallback substring matching when numeric parsing fails and operator is `:`
 *
 * Behavior:
 * - If `value` is `undefined`, the match always fails.
 * - If `rawQuery` contains `".."`, it is treated as a numeric range.
 * - Otherwise, both `value` and `rawQuery` are parsed as numbers and compared
 *   using the provided operator.
 * - If numeric parsing fails, only `:` operator allows fallback string matching.
 *
 * @param value - The value to test. Can be a number, numeric string, or undefined.
 * @param operator - Comparison operator (`:`, `=`, `!=`, `>`, `>=`, `<`, `<=`).
 * @param rawQuery - The query string, either a number or a range expression like `"2..5"`.
 * @returns `true` if the value matches the query according to the operator/range rules, otherwise `false`.
 */
function matchesNumeric(value: number | string | undefined, operator: ComparisonOperator, rawQuery: string): boolean {
  if (value === undefined) {
    return false;
  }

  const normalizedQuery = normalize(rawQuery);
  if (normalizedQuery.includes("..")) {
    const numericValue = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(numericValue) && matchesRange(numericValue, normalizedQuery);
  }

  const numericValue = typeof value === "number" ? value : Number.parseFloat(value);
  const numericQuery = Number.parseFloat(normalizedQuery);

  if (!Number.isFinite(numericQuery) || !Number.isFinite(numericValue)) {
    return operator === ":"
      ? String(value).toLowerCase().includes(normalizedQuery)
      : false;
  }

  switch (operator) {
    case ":":
    case "=":
      return numericValue === numericQuery;
    case "!=":
      return numericValue !== numericQuery;
    case ">":
      return numericValue > numericQuery;
    case ">=":
      return numericValue >= numericQuery;
    case "<":
      return numericValue < numericQuery;
    case "<=":
      return numericValue <= numericQuery;
  }
}

// todo properly implement <, <=, ... operators
function matchesColorClause(card: ScryfallOracleCard, rawQuery: string): boolean {
  const query = normalize(rawQuery);
  const colorIdentity = asStringArray(card.color_identity);
  const colors = asStringArray(card.colors);

  if (query === "colorless") {
    return colorIdentity.length === 0;
  }

  if (query === "multicolor") {
    return colorIdentity.length > 1;
  }

  if (query === "monocolor" || query === "mono") {
    return colorIdentity.length === 1;
  }

  const symbols = query.replace(/[^wubrgc]/g, "");

  const colorSet = new Set([...colors, ...colorIdentity].map(normalize));
  return Array.from(symbols).every((symbol) => COLOR_SYMBOLS.has(symbol) && colorSet.has(symbol));
}

function matchesIsClause(card: ScryfallOracleCard, rawQuery: string): boolean {
  const query = normalize(rawQuery);

  if (query === "legendary") {
    return asString(card.type_line).toLowerCase().includes("legendary");
  }

  if (MAIN_TYPE_KEYWORDS.has(query)) {
    return asString(card.type_line).toLowerCase().includes(query);
  }

  const colorIdentity = asStringArray(card.color_identity);

  if (query === "multicolor") {
    return colorIdentity.length > 1;
  }

  if (query === "monocolor" || query === "mono") {
    return colorIdentity.length === 1;
  }

  if (query === "colorless") {
    return colorIdentity.length === 0;
  }

  return true;
}

function matchesClause(card: ScryfallOracleCard, clause: ParsedClause): boolean {
  const field = clause.field;

  if (!field) {
    return matchesText(card.name, clause.value)
  }

  switch (field) {
    case "name":
    case "n":
      return matchesText(asString(card.name).toLowerCase(), clause.value);
    case "type":
    case "t":
      return matchesText(asString(card.type_line).toLowerCase(), clause.value);
    case "oracle":
    case "o":
      return matchesText((card.oracle_text ?? "").toLowerCase(), clause.value)
        || matchesText(getFaceSearchText(card).toLowerCase(), clause.value);
    case "set":
    case "s":
      return matchesText(`${asString(card.set)} ${asString(card.set_name)}`.toLowerCase(), clause.value);
    case "rarity":
    case "r":
      return matchesText(asString(card.rarity).toLowerCase(), clause.value);
    case "cmc":
    case "mv":
    case "mana":
    case "manavalue":
      return matchesNumeric(card.cmc, clause.operator, clause.value);
    case "power":
      return matchesNumeric(card.power, clause.operator, clause.value);
    case "toughness":
      return matchesNumeric(card.toughness, clause.operator, clause.value);
    case "color":
    case "c":
      return matchesColorClause(card, clause.value);
    case "identity":
    case "id":
      return matchesColorClause(card, clause.value);
    case "kw":
    case "keyword":
      return asStringArray(card.keywords).some((keyword) => matchesText(keyword.toLowerCase(), clause.value));
    case "is":
      return matchesIsClause(card, clause.value);
    default:
      return true; // make incorrect clauses less punishing
  }
}

export function createScryfallCardMatcher(query: string): (card: ScryfallOracleCard) => boolean {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return () => true;
  }

  const clauses = splitClauses(trimmedQuery).map(parseClause);

  return (card) => clauses.every((clause) => {
    const matched = matchesClause(card, clause);
    return clause.negated ? !matched : matched;
  });
}

export function filterCardsByScryfallQuery(cards: ScryfallOracleCard[], query: string): ScryfallOracleCard[] {
  const matcher = createScryfallCardMatcher(query);
  return cards.filter(matcher);
}

export function filterDeckByScryfallQuery(deck: Deck, query: string): Deck {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return deck;
  }

  return {
    ...deck,
    sections: Object.fromEntries(
      Object.entries(deck.sections).map(([sectionName, cards]) => [sectionName, filterCardsByScryfallQuery(cards, trimmedQuery)]),
    ) as Deck["sections"],
  };
}


