// Deck-related fully functional model (no classes, no mutation)

import type {OracleCard} from "./scryfall.js";
import {DECK_SECTION_NAMES} from "./repositoryTypes.js";
import type {OracleId, DeckSectionName} from "./repositoryTypes.js";

export const SECTION_BY_LABEL: Record<string, DeckSectionName> =
  Object.fromEntries(
    DECK_SECTION_NAMES.map(name => [name.toLowerCase(), name])
  );


export type TaggedCard = OracleCard & {
  tags: string[];
};

export type DeckCard = TaggedCard & {
  count: number;
};


export type TaggedDeckCard = DeckCard & {
  tags: string[];
};

export function isDeckCard(card: OracleCard): card is DeckCard {
  return "count" in card;
}


/**
 * A section is a pure map: oracleId -> card
 */
export type HydratedDeckSection = Record<OracleId, DeckCard>;

/**
 * A deck is a collection of sections
 */
export type HydratedDeck = Partial<Record<DeckSectionName, HydratedDeckSection>>;

/* -------------------------
   Section-level operations
--------------------------*/

export const addCard = (
  section: HydratedDeckSection,
  card: DeckCard,
  amount = 1
): HydratedDeckSection => {
  const existing = section[card.oracle_id];

  return {
    ...section,
    [card.oracle_id]: existing
      ? {...existing, count: existing.count + amount}
      : {...card, count: amount}
  };
};

export const cardCount = (section: HydratedDeckSection): number =>
  Object.values(section).reduce((sum, c) => sum + c.count, 0);

/* -------------------------
   Deck-level operations
--------------------------*/

// todo consider removing
const ensureSection = (
  deck: HydratedDeck,
  name: DeckSectionName
): HydratedDeck => ({
  ...deck,
  [name]: deck[name] ?? {}
});

export const addCardToDeck = (
  deck: HydratedDeck,
  sectionName: DeckSectionName,
  card: DeckCard,
  amount = card.count
): HydratedDeck => {
  const section = deck[sectionName] ?? {};

  return {
    ...deck,
    [sectionName]: addCard(section, card, amount)
  };
};

export const isEmpty = (deck: HydratedDeck): boolean =>
  Object.values(deck).every(
    section => Object.keys(section ?? {}).length === 0
  );

/* -------------------------
   Tagging
--------------------------*/

// export const tagSection = (
//   section: DeckSection,
//   tagsMap: TagsMap
// ): Record<OracleId, TaggedDeckCard> => {
//   const out: Record<OracleId, TaggedDeckCard> = {};
//
//   for (const [id, card] of Object.entries(section)) {
//     out[id] = {
//       ...card,
//       tags: tagsMap[id] ?? []
//     };
//   }
//
//   return out;
// };

// export const withTags = (
//   deck: DeckSections,
//   tagsMap: TagsMap
// ): DeckSections => {
//   const out: DeckSections = {};
//
//   for (const name of DECK_SECTION_NAMES) {
//     const section = deck[name];
//     if (!section) continue;
//
//     out[name] = tagSection(section, tagsMap);
//   }
//
//   return out;
// };