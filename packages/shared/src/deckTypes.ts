// Deck-related shared types.

import type {ScryfallOracleCard} from './scryfall.js';

export type TagsMap = Record<string, string[]>;

export type DeckSectionName = 'Main' | 'Commander' | 'Sideboard' | 'Considering';

/**
 * Maps section labels (as they appear in decklists) to their canonical DeckSectionName.
 */
export const SECTION_BY_LABEL: Record<string, DeckSectionName> = {
  commander: 'Commander',
  main: 'Main',
  sideboard: 'Sideboard',
  considering: 'Considering',
};

// Card with count property, count is part of the card object itself
export interface DeckCard extends ScryfallOracleCard {
  count: number;
}

// todo add proper compile-time enforcement
type OracleId = string;

export interface DeckSection {
  name: DeckSectionName,
  cards: Record<OracleId, DeckCard>
}

export interface Deck {
  name: string;
  sections: {
    Main: DeckCard[];
  } & Partial<Record<Exclude<DeckSectionName, 'Main'>, DeckCard[]>>;
}

// This structure makes it easier to store tags state separately to reduce frontend lag.
export interface TaggedDeck {
  deck: Deck;
  tagsMap: TagsMap;
}
