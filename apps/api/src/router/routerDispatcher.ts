import {healthRouter} from "./healthRouter.js";
import {scryfallRouter} from "./scryfallRouter.js";
import {deckImportRouter} from "./deckImportRouter.js";
import {authRouter} from "./authRouter.js";
import {router} from "../trpc.js";
import {decksRouter} from "./decksRouter.js";
import {cardRouter} from "./cardsRouter.js";
import {repositoryPreferencesRouter} from "./preferencesRouter.js";

export const appRouter = router({
  health: healthRouter,
  scryfall: scryfallRouter,
  deckImport: deckImportRouter,
  auth: authRouter,
  decks: decksRouter,
  cards: cardRouter,
  repositoryPreferences: repositoryPreferencesRouter
});

export type AppRouter = typeof appRouter;

