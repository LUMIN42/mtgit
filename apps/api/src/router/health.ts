import { router, publicProcedure } from '../trpc.js';

export const healthRouter = router({
  ping: publicProcedure.query(() => ({
    ok: true,
    timestamp: new Date().toISOString(),
  })),
});

