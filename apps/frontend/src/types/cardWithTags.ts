import type { ScryfallOracleCard } from "./scryfall.ts";

export type CardWithTags = ScryfallOracleCard & {
  tags: string[];
};