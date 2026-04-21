import type {ScryfallOracleCard} from './scryfall.js';
export type TagsMap = Record<string, string[]>;
export type DeckSectionName = 'Main' | 'Commander' | 'Sideboard' | 'Considering';
export type DeckSections = {
  Main: ScryfallOracleCard[];
} & Partial<Record<Exclude<DeckSectionName, 'Main'>, ScryfallOracleCard[]>>;
export interface Deck {
  name: string;
  sections: DeckSections;
}

// this structure makes it easier to store tags state separately to reduce lag
export interface TaggedDeck {
  deck: Deck;
  tagsMap: TagsMap;
}