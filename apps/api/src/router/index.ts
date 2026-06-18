import {healthRouter} from "./health.js";
import {scryfallRouter} from "./scryfall.js";
import {deckImportRouter} from "./deckImport.js";
import {authRouter} from "./auth.js";
import {publicProcedure, router} from "../trpc.js";
import {decksRouter} from "./decks.js";

export const appRouter = router({
  health: healthRouter,
  scryfall: scryfallRouter,
  deckImport: deckImportRouter,
  auth: authRouter,
  decks: decksRouter,
  hello: publicProcedure.query(() => ({
    message: "Hello world from tRPC + Express"
  }))
});

export type AppRouter = typeof appRouter;

