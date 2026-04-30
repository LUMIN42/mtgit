import { z } from 'zod';

import { publicProcedure, router } from '../trpc.js';
import { parseDeckImportText } from '../services/deckImport.js';

export const deckImportRouter = router({
  parse: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      return parseDeckImportText(input.text);
    }),
});

