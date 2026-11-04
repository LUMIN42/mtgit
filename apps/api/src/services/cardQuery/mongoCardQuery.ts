/**
 * Compiles a parsed {@link CardQuery} into a mongo filter over the `scryfall_cards` collection.
 *
 * The collection stores cards in the OracleCard shape: every card has `card_faces`
 * and top-level `colors` (the union of its faces' colors).
 */

import type {Document, Filter} from "mongodb";
import type {CardPredicate, CardPredicateField, CardQuery, ColorTarget, Comparison} from "@mtgit/shared";
import {raritiesMatching} from "@mtgit/shared";

type PredicateCompilers = {
  [F in CardPredicateField]: (predicate: Extract<CardPredicate, {field: F}>) => Filter<Document>;
};

const MONGO_COMPARISON: Record<Comparison, string> = {
  "=": "$eq",
  "!=": "$ne",
  ">": "$gt",
  ">=": "$gte",
  "<": "$lt",
  "<=": "$lte"
};

/**
 * Aggregation expression converting a string field (prices, power, toughness) to a number,
 * or null when it is missing or not numeric (e.g. a `*` power).
 */
function toNumber(expression: string) {
  return {$convert: {input: expression, to: "double", onError: null, onNull: null}};
}

/**
 * Missing values never match, also for `!=` (in aggregation, null would compare as smaller than any number).
 */
function numberComparisonExpression(number: Document, comparison: Comparison, value: number): Document {
  return {
    $and: [
      {$ne: [number, null]},
      {[MONGO_COMPARISON[comparison]]: [number, value]}
    ]
  };
}

/** Matches when any face's stat (e.g. `power`) satisfies the comparison. */
function anyFaceStat(stat: "power" | "toughness", comparison: Comparison, value: number): Filter<Document> {
  return {
    $expr: {
      $anyElementTrue: [{
        $map: {
          input: "$card_faces",
          as: "face",
          in: numberComparisonExpression(toNumber(`$$face.${stat}`), comparison, value)
        }
      }]
    }
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsText(value: string) {
  return {$regex: escapeRegex(value), $options: "i"};
}

/**
 * @param colors aggregation expression evaluating to the card's color array
 * @returns aggregation expression of `colors <comparison> target` with set semantics
 */
function colorComparisonExpression(colors: unknown, comparison: Comparison, target: ColorTarget): Document {
  const size = {$size: colors};

  if (target.kind === "count") {
    return {[MONGO_COMPARISON[comparison]]: [size, target.count]};
  }

  const subset = {$setIsSubset: [colors, target.colors]};
  const superset = {$setIsSubset: [target.colors, colors]};
  const equal = {$and: [subset, superset]};

  switch (comparison) {
    case "=":
      return equal;
    case "!=":
      return {$not: [equal]};
    case ">=":
      return superset;
    case "<=":
      return subset;
    case ">":
      return {$and: [superset, {$gt: [size, target.colors.length]}]};
    case "<":
      return {$and: [subset, {$lt: [size, target.colors.length]}]};
  }
}

const PREDICATE_COMPILERS: PredicateCompilers = {
  name: ({value}) => ({name: containsText(value)}),
  type: ({value}) => ({type_line: containsText(value)}),
  oracle: ({value}) => ({"card_faces.oracle_text": containsText(value)}),
  manaValue: ({comparison, value}) => ({cmc: {[MONGO_COMPARISON[comparison]]: value}}),
  usd: ({comparison, value}) => ({
    $expr: numberComparisonExpression(toNumber("$prices.usd"), comparison, value)
  }),
  power: ({comparison, value}) => anyFaceStat("power", comparison, value),
  toughness: ({comparison, value}) => anyFaceStat("toughness", comparison, value),
  color: ({comparison, target}) => ({
    $expr: colorComparisonExpression("$colors", comparison, target)
  }),
  identity: ({comparison, target}) => ({
    $expr: colorComparisonExpression("$color_identity", comparison, target)
  }),
  rarity: ({comparison, rarity}) => ({rarity: {$in: raritiesMatching(comparison, rarity)}}),
  // the parser only allows alphanumeric formats, so this cannot address an arbitrary path
  format: ({format}) => ({[`legalities.${format}`]: {$in: ["legal", "restricted"]}}),
  // tags belong to a deck, not to a card in the db, so no card matches
  tag: () => ({$expr: false})
};

function compilePredicate(predicate: CardPredicate): Filter<Document> {
  const compiler = PREDICATE_COMPILERS[predicate.field] as (predicate: CardPredicate) => Filter<Document>;
  return compiler(predicate);
}

export function toMongoCardFilter(query: CardQuery): Filter<Document> {
  switch (query.kind) {
    case "predicate":
      return compilePredicate(query.predicate);
    case "not":
      return {$nor: [toMongoCardFilter(query.child)]};
    case "and":
      return {$and: query.children.map(toMongoCardFilter)};
    case "or":
      return {$or: query.children.map(toMongoCardFilter)};
  }
}
