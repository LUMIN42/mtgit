import { publicProcedure, router } from '../trpc.js';
import { ScryfallSearchQuerySchema, searchScryfallCards } from '@mtgit/shared/scryfallSearch';

/**
 * tRPC router for Scryfall card queries.
 * Provides endpoints that proxy live searches to the Scryfall API.
 */
export const scryfallRouter = router({
  /**
   * Full-featured card search driven by a raw Scryfall query string.
   */
  search: publicProcedure
    .input(ScryfallSearchQuerySchema)
    .query(async ({ input }) => searchScryfallCards(input.query, input.limit, input.skip)),
});
