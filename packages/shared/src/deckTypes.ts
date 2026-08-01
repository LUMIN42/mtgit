/**
 * This file has the hydrated counterparts to types in repositoryTypes.ts.
 * Hydrated means that the cards contain all the card's information instead of just the oracle id.
 */

import type {OracleCard} from "./cards.js";
import {DECK_SECTION_NAMES} from "./repositoryTypes.js";
import type {OracleId, DeckSectionName} from "./repositoryTypes.js";

export type TaggedCard = OracleCard & {
  tags: string[];
};

export type DeckCard = TaggedCard & {
  count: number;
};

export type TaggedDeckCard = DeckCard & {
  tags: string[];
};

export type HydratedDeckSection = Record<OracleId, DeckCard>;

export type HydratedDeck = Partial<Record<DeckSectionName, HydratedDeckSection>>;

export const SECTION_BY_LABEL: Record<string, DeckSectionName> =
  Object.fromEntries(
    DECK_SECTION_NAMES.map(name => [name.toLowerCase(), name])
  );

export function isDeckCard(card: OracleCard): card is DeckCard {
  return "count" in card;
}

/* -------------------------
   Section-level operations
--------------------------*/

export function addCard(
  section: HydratedDeckSection,
  card: DeckCard,
  amount = 1
): HydratedDeckSection {
  const existing = section[card.oracle_id];

  return {
    ...section,
    [card.oracle_id]: existing
      ? {...existing, count: existing.count + amount}
      : {...card, count: amount}
  };
}

export function cardCount(section: HydratedDeckSection): number {
  return Object.values(section).reduce((sum, c) => sum + c.count, 0);
}

/* -------------------------
   Deck-level operations
--------------------------*/

// todo consider removing
function ensureSection(
  deck: HydratedDeck,
  name: DeckSectionName
): HydratedDeck {
  return {
    ...deck,
    [name]: deck[name] ?? {}
  };
}

export function addCardToDeck(
  deck: HydratedDeck,
  sectionName: DeckSectionName,
  card: DeckCard,
  amount = card.count
): HydratedDeck {
  const section = deck[sectionName] ?? {};

  return {
    ...deck,
    [sectionName]: addCard(section, card, amount)
  };
}

export function isEmpty(deck: HydratedDeck): boolean {
  return Object.values(deck).every(
    section => Object.keys(section ?? {}).length === 0
  );
}
