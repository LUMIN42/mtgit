import {trpc} from "../trpcClient.ts";

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
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
  const utils = trpc.useUtils();

  return trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    }
  });
}