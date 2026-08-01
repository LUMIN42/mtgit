import {trpcHooks} from "../trpcClient.ts";

/**
 * Contains basic information of the currently logged-in user.
 */
export function useAuth() {
  const meQuery = trpcHooks.auth.me.useQuery(undefined, {
    retry: false
  });

  if (meQuery.isError) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: meQuery.refetch
    };
  }

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    refetch: meQuery.refetch
  };
}

/**
 * Login mutation.
 */
export function useLogin() {
  const utils = trpcHooks.useUtils();

  return trpcHooks.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate(undefined);
    }
  });
}