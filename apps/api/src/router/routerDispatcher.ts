import {healthRouter} from "./healthRouter.js";
import {deckImportRouter} from "./deckImportRouter.js";
import {authRouter} from "./authRouter.js";
import {router} from "../trpc.js";
import {decksRouter} from "./decksRouter.js";
import {cardRouter} from "./cardsRouter.js";
import {repositoryPreferencesRouter} from "./preferencesRouter.js";
import {recommendationsRouter} from "./recommendationsRouter.js";

export const appRouter = router({
  health: healthRouter,
  deckImport: deckImportRouter,
  auth: authRouter,
  decks: decksRouter,
  cards: cardRouter,
  repositoryPreferences: repositoryPreferencesRouter,
  recommendations: recommendationsRouter
});

export type AppRouter = typeof appRouter;

