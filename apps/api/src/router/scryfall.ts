import { z } from 'zod';

import { getMongoService } from '../db/mongo.js';
import { publicProcedure, router } from '../trpc.js';
import { ScryfallQueryService, ScryfallQuerySchema } from '../services/scryfallQuery.js';

/**
 * tRPC router for Scryfall card queries.
 * Provides endpoints for searching the scryfall_cards collection.
 */
export const scryfallRouter = router({
  /**
   * Full-featured card search with all available filters.
   */
  search: publicProcedure
    .input(ScryfallQuerySchema.partial())
    .query(async ({ input }) => {
      const mongoService = await getMongoService();
      const queryService = new ScryfallQueryService(mongoService);
      return queryService.search({
        ...input,
        limit: input.limit ?? 20,
        skip: input.skip ?? 0,
      });
    }),

  /**
   * Search cards by name (case-insensitive regex).
   */
  searchByName: publicProcedure
    .input(z.object({ name: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const mongoService = await getMongoService();
      const queryService = new ScryfallQueryService(mongoService);
      return queryService.searchByName(input.name, input.limit ?? 10);
    }),

  /**
   * Search cards by color identity.
   */
  searchByColor: publicProcedure
    .input(z.object({ colors: z.array(z.string()), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const mongoService = await getMongoService();
      const queryService = new ScryfallQueryService(mongoService);
      return queryService.searchByColor(input.colors, input.limit ?? 10);
    }),

  /**
   * Search cards by type line (case-insensitive regex).
   */
  searchByType: publicProcedure
    .input(z.object({ type_line: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const mongoService = await getMongoService();
      const queryService = new ScryfallQueryService(mongoService);
      return queryService.searchByType(input.type_line, input.limit ?? 10);
    }),
});


