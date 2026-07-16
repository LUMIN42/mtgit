import {createContext, useContext, useEffect} from "react";
import type {ReactNode} from "react";
import {RepositoryPreferences, RepositoryPreferencesSchema} from "@mtgit/shared";
import {trpc} from "../trpcClient.ts";
import {useRepositoryContext} from "./RepositoryContext.tsx";
import {useDeckUiContext} from "./DeckUiContext.tsx";

type RepositoryPreferencesContextValue = {
  preferences: RepositoryPreferences;
  updatePreferences: (p: Partial<RepositoryPreferences>) => void;
  isFetching: boolean;
};

const RepositoryPreferencesContext = createContext<RepositoryPreferencesContextValue | undefined>(
  undefined
);

export function RepositoryPreferencesProvider({
  children,
  repositoryId
}: {
  children: ReactNode;
  repositoryId: string;
}) {

  const {repository} = useRepositoryContext();
  const {selectedBranchName, setSelectedBranchName} = useDeckUiContext();


  const {data, isFetching} = trpc.repositoryPreferences.get.useQuery(
    {
      repositoryId: repositoryId
    }
  );

  const preferences = RepositoryPreferencesSchema.parse(data ?? {});

  const utils = trpc.useUtils();

  useEffect(
    () => {
      if (selectedBranchName) {
        return;
      }

      if (data) {
        if (preferences.openBranchName) {
          setSelectedBranchName(preferences.openBranchName);
        }
        else if (repository && repository.branches) {
          setSelectedBranchName(Object.keys(repository.branches)[0]);
        }
      }

    },
    [preferences, repository]
  );


  const setPreferencesMutation = trpc.repositoryPreferences.set.useMutation({
    onSuccess: async () => {
      await utils.repositoryPreferences.get.invalidate();
    }
  });

  function updatePreferences(newData: Partial<RepositoryPreferences>) {
    setPreferencesMutation.mutate({
      preferences: {...preferences, ...newData},
      repositoryId: repository._id
    });
  }

  return (
    <RepositoryPreferencesContext.Provider value={{preferences, updatePreferences, isFetching}}>
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
