import type {Deck} from "../types/deck.ts";
import type {ScryfallOracleCard} from "../types/scryfall.ts";

type NumericOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | ":";

interface ParsedClause {
  negated: boolean;
  field: string | null;
  operator: NumericOperator;
  value: string;
}

const COLOR_SYMBOLS = new Set(["w", "u", "b", "r", "g", "c"]);
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

function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  let escaped = false;

  for (const char of query.trim()) {
    if (escaped) {
      current += char;
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
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function parseClause(token: string): ParsedClause {
  const negated = token.startsWith("-");
  const trimmedToken = negated ? token.slice(1) : token;
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
    operator: match[2] as NumericOperator,
    value: match[3].trim(),
  };
}

function getFaceSearchText(card: ScryfallOracleCard): string {
  return card.card_faces
    ?.map((face) => [face.name, face.type_line, face.oracle_text ?? ""].join(" "))
    .join(" ") ?? "";
}

function getSearchableText(card: ScryfallOracleCard): string {
  return [
    asString(card.name),
    asString(card.type_line),
    asString(card.oracle_text),
    asString(card.set),
    asString(card.set_name),
    asString(card.rarity),
    asStringArray(card.keywords).join(" "),
    asStringArray(card.colors).join(" "),
    asStringArray(card.color_identity).join(" "),
    getFaceSearchText(card),
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function matchesText(haystack: string, needle: string): boolean {
  return haystack.includes(normalize(needle));
}

function matchesRange(value: number, rangeExpression: string): boolean {
  const [lowerRaw, upperRaw] = rangeExpression.split("..", 2);
  const lower = Number.parseFloat(lowerRaw);
  const upper = Number.parseFloat(upperRaw);

  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return false;
  }

  return value >= lower && value <= upper;
}

function matchesNumeric(value: number | string | undefined, operator: NumericOperator, rawQuery: string): boolean {
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
  if (symbols.length === 0) {
    return getSearchableText(card).includes(query);
  }

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

  return getSearchableText(card).includes(query);
}

function matchesClause(card: ScryfallOracleCard, clause: ParsedClause): boolean {
  const field = clause.field;

  if (!field) {
    return getSearchableText(card).includes(normalize(clause.value));
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
    case "text":
      return getSearchableText(card).includes(normalize(clause.value));
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
      return getSearchableText(card).includes(normalize(clause.value));
  }
}

export function createScryfallCardMatcher(query: string): (card: ScryfallOracleCard) => boolean {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return () => true;
  }

  const clauses = tokenizeQuery(trimmedQuery).map(parseClause);

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



// src/utils/oracleSearch.ts
import oracleCardsUrl from "../assets/oracle-cards-20260411090222.json?url";
import {extractCardsFromOracleJson} from "./deckImport.ts";
// import type {ScryfallOracleCard} from "../types/scryfall.ts";
// import {extractCardsFromOracleJson} from "./deckImport.ts";
// import {createScryfallCardMatcher} from "./scryfallQueryFilter.ts";

let cachedOracleCardsPromise: Promise<ScryfallOracleCard[]> | null = null;

export async function loadOracleCards(): Promise<ScryfallOracleCard[]> {
  if (!cachedOracleCardsPromise) {
    cachedOracleCardsPromise = fetch(oracleCardsUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load oracle cards.");
        }
        return response.json();
      })
      .then((payload) => extractCardsFromOracleJson(payload));
  }

  return cachedOracleCardsPromise;
}

export function filterOracleCardsByQuery(
  cards: ScryfallOracleCard[],
  query: string,
): ScryfallOracleCard[] {
  const matcher = createScryfallCardMatcher(query);
  return cards.filter(matcher);
}

export async function loadOracleCardsByQuery(
  query: string,
): Promise<ScryfallOracleCard[]> {
  const cards = await loadOracleCards();
  return filterOracleCardsByQuery(cards, query);
}


