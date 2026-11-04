/**
 * Typed representation of a parsed scryfall-like card query.
 * Backends (e.g. the API's mongo compiler) only consume these types, never the raw query string.
 */

import type {ColorCode} from "../cards.js";
import {COLOR_CODES} from "../cards.js";

export const QUERY_OPERATORS = [":", "!=", ">=", "<=", "=", ">", "<"] as const;

/** Operators as written in a query; `:` means the field's default comparison. */
export type QueryOperator = (typeof QUERY_OPERATORS)[number];

/** Operators after `:` has been resolved by the field. */
export type Comparison = Exclude<QueryOperator, ":">;

/**
 * The five colors, i.e. {@link COLOR_CODES} without colorless:
 * in queries, colorless is not a color but the empty set of colors.
 */
export type QueryColor = Exclude<ColorCode, "C">;

export function isQueryColor(value: string): value is QueryColor {
  return value !== "C" && (COLOR_CODES as readonly string[]).includes(value);
}

/** Ordered from the most common, comparisons like `r>=rare` follow this order. */
export const RARITIES = ["common", "uncommon", "rare", "special", "mythic", "bonus"] as const;

export type Rarity = (typeof RARITIES)[number];

export type ColorTarget =
  | {kind: "set", colors: QueryColor[]}
  | {kind: "count", count: number};

/**
 * A single condition on a card.
 * To add a filterable field, add a variant here, its definition in `fields.ts`
 * and a compiler in every backend (the type checker points out the missing ones).
 */
export type CardPredicate =
  | {field: "name", value: string}
  | {field: "type", value: string}
  | {field: "oracle", value: string}
  | {field: "manaValue", comparison: Comparison, value: number}
  | {field: "usd", comparison: Comparison, value: number}
  | {field: "power", comparison: Comparison, value: number}
  | {field: "toughness", comparison: Comparison, value: number}
  | {field: "color", comparison: Comparison, target: ColorTarget}
  | {field: "identity", comparison: Comparison, target: ColorTarget}
  | {field: "rarity", comparison: Comparison, rarity: Rarity}
  | {field: "format", format: string}
  /** deck tags, they only exist in the frontend */
  | {field: "tag", value: string};

export type CardPredicateField = CardPredicate["field"];

/*
 * Groups of fields sharing the shape of their predicate, derived from CardPredicate,
 * so a new predicate of the same shape joins its group automatically.
 */

/** Fields searching text, e.g. `"name" | "type" | ...`. */
export type TextField = Extract<CardPredicate, {value: string}>["field"];

/** Fields compared as numbers, e.g. `"manaValue" | "usd" | ...`. */
export type NumberField = Extract<CardPredicate, {value: number}>["field"];

/** Fields compared as sets of colors, i.e. `"color" | "identity"`. */
export type ColorField = Extract<CardPredicate, {target: ColorTarget}>["field"];

export type CardQuery =
  | {kind: "predicate", predicate: CardPredicate}
  | {kind: "not", child: CardQuery}
  | {kind: "and", children: CardQuery[]}
  | {kind: "or", children: CardQuery[]};

export interface ParsedCardQuery {
  /** null when the query puts no restriction on cards */
  filter: CardQuery | null;
  /** keywords that change how results are presented rather than which cards match, e.g. `order:rec` */
  directives: Record<string, string>;
  /** human readable notes about parts of the query that were ignored */
  warnings: string[];
}
