import { z } from 'zod';

import { publicProcedure, router } from '../trpc.js';
import { getDeckImportService } from '../services/deckImport.js';

export const deckImportRouter = router({
  parse: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const service = await getDeckImportService();
      return service.parseDeckImportText(input.text);
    }),
});

