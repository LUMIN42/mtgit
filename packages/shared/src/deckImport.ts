import type {ScryfallOracleCard} from './scryfall.js';
export type TagsMap = Record<string, string[]>;
export type DeckSectionName = 'Main' | 'Commander' | 'Sideboard' | 'Considering';
export type DeckSections = {
  Main: ScryfallOracleCard[];
} & Partial<Record<Exclude<DeckSectionName, 'Main'>, ScryfallOracleCard[]>>;
export interface DeckImportDeck {
  name: string;
  sections: DeckSections;
}
export interface DeckImportResult {
  deck: DeckImportDeck;
  tagsMap: TagsMap;
}
export type OracleCardIndex = Map<string, ScryfallOracleCard>;