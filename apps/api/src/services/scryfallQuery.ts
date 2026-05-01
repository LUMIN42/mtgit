import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";
import {ScryfallSearchQuerySchema, type ScryfallSearchResult, searchScryfallCards} from "@mtgit/shared/scryfallSearch";

export {ScryfallSearchQuerySchema};

// todo actually implement it one day
export class ScryfallQueryService {
  constructor(_legacyDependency?: unknown) {}

  async search(query: string, limit: number = 20, skip: number = 0): Promise<{
    ok: boolean;
    message: string;
    cards: ScryfallOracleCard[];
    total: number;
  }> {
    return await searchScryfallCards(query, limit, skip);
  }
}
