import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../api/src/router';

const trpcApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/trpc';

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcApiUrl,
    }),
  ],
});
