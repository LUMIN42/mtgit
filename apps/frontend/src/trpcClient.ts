import {createTRPCReact} from "@trpc/react-query";
import {createTRPCClient, httpBatchLink} from "@trpc/client";
import type {AppRouter} from "../../api/src/router/routerDispatcher";

/**
 * 🔵 Base URL of your tRPC API
 */
const trpcApiUrl =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001/trpc" : "/trpc");

/**
 * 🔵 React tRPC instance (hooks)
 * Use this in components:
 *   trpc.auth.me.useQuery()
 */
export const trpcHooks = createTRPCReact<AppRouter>();

/**
 * 🔵 tRPC client (non-react usage, optional but useful)
 * Use this outside React (scripts, utils, etc.)
 */
export const trpcRaw = createTRPCClient<AppRouter>({
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