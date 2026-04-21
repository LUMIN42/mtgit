import { healthRouter } from './health.js';
import { dbRouter } from '../services/db.js';
import { scryfallRouter } from './scryfall.js';
import { deckImportRouter } from './deckImport.js';
import { publicProcedure, router } from '../trpc.js';

export const appRouter = router({
  health: healthRouter,
  db: dbRouter,
  scryfall: scryfallRouter,
  deckImport: deckImportRouter,
  hello: publicProcedure.query(() => ({
    message: 'Hello world from tRPC + Express',
  })),
});

export type AppRouter = typeof appRouter;

