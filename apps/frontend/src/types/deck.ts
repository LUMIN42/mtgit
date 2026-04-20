import type { ScryfallOracleCard } from "./scryfall.ts";
import type {CardWithTags} from "./cardWithTags.ts";

export type OptionalDeckSectionName =
  | "Commander"
  | "Sideboard"
  | "Considering";

export type DeckSectionName = "Main" | OptionalDeckSectionName;

export interface Deck {
  name: string;
  sections: {
    Main: ScryfallOracleCard[];
  } & {
    [K in OptionalDeckSectionName]?: CardWithTags[];
  };
}