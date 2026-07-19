import {trpcHooks} from "../trpcClient.ts";

export function useAuth() {
  const meQuery = trpcHooks.auth.me.useQuery(undefined, {
    retry: false
  });

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    refetch: meQuery.refetch
  };
}

export function useLogin() {
  const utils = trpcHooks.useUtils();

  return trpcHooks.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    }
  });
}