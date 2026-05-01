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

// DeckSection is an object with internal map (oracle_id -> DeckCard), but behaves like an array externally
export class DeckSection implements Iterable<DeckCard> {
  private readonly cardsMap: Record<OracleId, DeckCard>;

  constructor(public name: DeckSectionName, cards?: DeckCard[] | Record<OracleId, DeckCard>) {
    // this.name = name;
    if (Array.isArray(cards)) {
      this.cardsMap = {};
      for (const card of cards) {
        this.cardsMap[card.oracle_id] = card;
      }
    }
    else if (cards) {
      this.cardsMap = {...cards};
    }
    else {
      this.cardsMap = {};
    }
  }
  
  get length(): number {
    return Object.keys(this.cardsMap).length;
  }
  
  get(index: number): DeckCard | undefined {
    return Object.values(this.cardsMap)[index];
  }
  
  getById(oracleId: OracleId): DeckCard | undefined {
    return this.cardsMap[oracleId];
  }
  
  push(card: DeckCard): void {
    this.cardsMap[card.oracle_id] = card;
  }
  
  addCard(card: DeckCard, amount = 1): void {
    const existing = this.cardsMap[card.oracle_id];
    if (existing) {
      existing.count += amount;
    }
    else {
      this.cardsMap[card.oracle_id] = {...card, count: amount};
    }
  }
  
  removeById(oracleId: OracleId): void {
    delete this.cardsMap[oracleId];
  }
  
  toArray(): DeckCard[] {
    return Object.values(this.cardsMap);
  }
  
  [Symbol.iterator](): Iterator<DeckCard> {
    return this.toArray()[Symbol.iterator]();
  }
  
  toJSON(): DeckCard[] {
    return this.toArray();
  }
}

export interface Deck {
  name: string;
  sections: {
    Main: DeckSection;
  } & Partial<Record<Exclude<DeckSectionName, "Main">, DeckSection>>;
}

// This structure makes it easier to store tags state separately to reduce frontend lag.
export interface TaggedDeck {
  deck: Deck;
  tagsMap: TagsMap;
}
