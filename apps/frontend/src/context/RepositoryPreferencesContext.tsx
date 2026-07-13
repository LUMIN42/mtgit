import {createContext, useContext} from "react";
import type {ReactNode} from "react";
import {RepositoryPreferences, RepositoryPreferencesSchema} from "@mtgit/shared";
import {trpc} from "../trpcClient.ts";
import {useRepositoryContext} from "./RepositoryContext.tsx";

type RepositoryPreferencesContextValue = {
  preferences: RepositoryPreferences;
  updatePreferences: (p: Partial<RepositoryPreferences>) => void;
};

const RepositoryPreferencesContext = createContext<RepositoryPreferencesContextValue | undefined>(
  undefined
);

export function RepositoryPreferencesProvider({
  children
}: {
  children: ReactNode;
}) {

  const {repository} = useRepositoryContext();


  const {data} = trpc.repositoryPreferences.get.useQuery(
    {
      repositoryId: repository._id!
    },
    {
      enabled: !!repository
    }
  );

  const preferences = data ?? RepositoryPreferencesSchema.parse({});

  const utils = trpc.useUtils();


  const setPreferencesMutation = trpc.repositoryPreferences.set.useMutation({
    onSuccess: async () => {
      await utils.repositoryPreferences.get.invalidate();
    }
  });

  function updatePreferences(newData: Partial<RepositoryPreferences>) {
    setPreferencesMutation.mutate({
      preferences: newData,
      repositoryId: repository._id
    });
  }

  return (
    <RepositoryPreferencesContext.Provider value={{preferences, updatePreferences}}>
      {children}
    </RepositoryPreferencesContext.Provider>
  );
}

export function useRepositoryPreferences() {
  const ctx = useContext(RepositoryPreferencesContext);
  if (!ctx) {
    throw new Error("useRepositoryPreferences must be used within RepositoryPreferencesProvider");
  }
  return ctx;
}
