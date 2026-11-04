/**
 * Filters cards in memory by a scryfall-like query, e.g. the deck view's filter field.
 * Parsing is shared with the API (see `@mtgit/shared` cardQuery), this file only evaluates the parsed query.
 * The API's counterpart is `apps/api/src/services/cardQuery/mongoCardQuery.ts`, keep their meaning in sync.
 */

import type {
  CardPredicate,
  CardPredicateField,
  CardQuery,
  ColorTarget,
  Comparison,
  HydratedDeck,
  TaggedCard
} from "@mtgit/shared";
import {compareNumbers, isQueryColor, parseCardQuery, raritiesMatching} from "@mtgit/shared";

type PredicateMatchers = {
  [F in CardPredicateField]: (card: TaggedCard, predicate: Extract<CardPredicate, {field: F}>) => boolean;
};

function containsText(haystack: string | undefined, needle: string): boolean {
  return (haystack ?? "").toLowerCase().includes(needle.toLowerCase());
}

/**
 * Prices, power and toughness are strings, missing or non-numeric ones (e.g. `*`) never match.
 */
function matchesNumberString(raw: string | null | undefined, comparison: Comparison, value: number): boolean {
  const number = raw === null || raw === undefined || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(number) && compareNumbers(number, comparison, value);
}

/**
 * Set semantics on colors, e.g. `>=` means "has at least these colors".
 */
function matchesColors(cardColors: string[], comparison: Comparison, target: ColorTarget): boolean {
  // colorless is the empty set, ignore any "C" entries
  const colors = new Set(cardColors.filter(isQueryColor));

  if (target.kind === "count") {
    return compareNumbers(colors.size, comparison, target.count);
  }

  const subset = [...colors].every(color => target.colors.includes(color));
  const superset = target.colors.every(color => colors.has(color));

  switch (comparison) {
    case "=":
      return subset && superset;
    case "!=":
      return !(subset && superset);
    case ">=":
      return superset;
    case "<=":
      return subset;
    case ">":
      return superset && colors.size > target.colors.length;
    case "<":
      return subset && colors.size < target.colors.length;
  }
}

const PREDICATE_MATCHERS: PredicateMatchers = {
  name: (card, {value}) => containsText(card.name, value),
  type: (card, {value}) => containsText(card.type_line, value),
  oracle: (card, {value}) => card.card_faces.some(face => containsText(face.oracle_text, value)),
  manaValue: (card, {comparison, value}) => compareNumbers(card.cmc, comparison, value),
  usd: (card, {comparison, value}) => matchesNumberString(card.prices?.usd, comparison, value),
  power: (card, {comparison, value}) =>
    card.card_faces.some(face => matchesNumberString(face.power, comparison, value)),
  toughness: (card, {comparison, value}) =>
    card.card_faces.some(face => matchesNumberString(face.toughness, comparison, value)),
  color: (card, {comparison, target}) => matchesColors(card.colors, comparison, target),
  identity: (card, {comparison, target}) => matchesColors(card.color_identity, comparison, target),
  rarity: (card, {comparison, rarity}) =>
    (raritiesMatching(comparison, rarity) as string[]).includes(card.rarity),
  format: (card, {format}) => ["legal", "restricted"].includes(card.legalities[format] ?? ""),
  tag: (card, {value}) => card.tags.some(tag => containsText(tag, value))
};

function matchesPredicate(card: TaggedCard, predicate: CardPredicate): boolean {
  const matcher = PREDICATE_MATCHERS[predicate.field] as (card: TaggedCard, predicate: CardPredicate) => boolean;
  return matcher(card, predicate);
}

export function matchesCardQuery(card: TaggedCard, query: CardQuery): boolean {
  switch (query.kind) {
    case "predicate":
      return matchesPredicate(card, query.predicate);
    case "not":
      return !matchesCardQuery(card, query.child);
    case "and":
      return query.children.every(child => matchesCardQuery(card, child));
    case "or":
      return query.children.some(child => matchesCardQuery(card, child));
  }
}

/**
 * Unsupported parts of the query are ignored, the parser's warnings are not shown here.
 */
export function filterDeckByScryfallQuery(deck: HydratedDeck, query: string): HydratedDeck {
  const {filter} = parseCardQuery(query);

  if (filter === null) {
    return deck;
  }

  return Object.fromEntries(
    Object.entries(deck).map(([sectionName, section]) => [
      sectionName,
      Object.fromEntries(
        Object.values(section)
          .filter(card => matchesCardQuery(card, filter))
          .map(card => [card.oracle_id, card])
      )
    ])
  );
}
