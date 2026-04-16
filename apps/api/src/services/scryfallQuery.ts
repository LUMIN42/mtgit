import type { ScryfallOracleCard } from '@mtgit/shared/scryfall';
import {
  ScryfallSearchQuerySchema,
  searchScryfallCards,
  type ScryfallSearchResult,
} from '@mtgit/shared/scryfallSearch';

export { ScryfallSearchQuerySchema };

export class ScryfallQueryService {
  constructor(_legacyDependency?: unknown) {}

  async search(query: string, limit: number = 20, skip: number = 0): Promise<{
    ok: boolean;
    message: string;
    cards: ScryfallOracleCard[];
    total: number;
  }> {
    const result: ScryfallSearchResult = await searchScryfallCards(query, limit, skip);
    return result;
  }
}
