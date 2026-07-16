import {createTRPCReact} from "@trpc/react-query";
import {createTRPCClient, httpBatchLink} from "@trpc/client";
import {QueryClient} from "@tanstack/react-query";
import type {AppRouter} from "../../api/src/router/routerDispatcher";

/**
 * 🔵 Base URL of your tRPC API
 */
const trpcApiUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/trpc";

/**
 * 🔵 React tRPC instance (hooks)
 * Use this in components:
 *   trpc.auth.me.useQuery()
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * 🔵 React Query client (must be singleton)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    }
  }
});

/**
 * 🔵 tRPC client (non-react usage, optional but useful)
 * Use this outside React (scripts, utils, etc.)
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcApiUrl,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include"
        });
      }
    })
  ]
});

/**
 * 🔧 Internal link config (used by React provider)
 */
export const trpcLinks = [
  httpBatchLink({
    url: trpcApiUrl,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include"
      });
    }
  })
];