import {createContext, useCallback, useContext, useEffect, useMemo} from "react";
import type {ReactNode} from "react";
import {RepositoryPreferences, RepositoryPreferencesSchema} from "@mtgit/shared";
import {trpcHooks, trpcRaw} from "../trpcClient.ts";
import {useRepositoryContext} from "./RepositoryContext.tsx";
import {useDeckUrlManager} from "../hooks/DeckUrlManager.tsx";

type RepositoryPreferencesContextValue = {
  preferences: RepositoryPreferences;
  updatePreferences: (p: Partial<RepositoryPreferences>) => void;
  isFetching: boolean;
};

const RepositoryPreferencesContext = createContext<RepositoryPreferencesContextValue | undefined>(
  undefined
);

function RepositoryPreferencesBranchSync({
  preferences
}: {
  preferences: RepositoryPreferences;
}) {
  const {repository} = useRepositoryContext();
  const {editedBranchName: selectedBranchName, setEditedBranchName: setSelectedBranchName} = useDeckUrlManager();

  useEffect(
    () => {
      if (selectedBranchName) {
        return;
      }

      if (preferences.openBranchName) {
        setSelectedBranchName(preferences.openBranchName);
      }
      else if (repository && repository.branches) {
        setSelectedBranchName(Object.keys(repository.branches)[0]);
      }
    },
    [preferences.openBranchName, repository, selectedBranchName, setSelectedBranchName]
  );

  return null;
}

export function RepositoryPreferencesProvider({
  children,
  repositoryId
}: {
  children: ReactNode;
  repositoryId: string;
}) {

  const {repository} = useRepositoryContext();

  const {data, isFetching} = trpcHooks.repositoryPreferences.get.useQuery(
    {
      repositoryId: repositoryId
    }
  );

  const utils = trpcHooks.useUtils();


  const preferences = useMemo(
    () => RepositoryPreferencesSchema.parse(data ?? {}),
    [data]
  );

  const branchNames = useMemo(
    () => Object.keys(repository.branches),
    [repository.branches]
  );

  useEffect(() => {
    for (const branchName of branchNames) {
      utils.repositoryPreferences.getBranchVisibility.setData(
        {repositoryId, branchName},
        {
          hidden: preferences.hiddenBranches.includes(branchName)
        }
      );
    }
  }, [preferences.hiddenBranches, branchNames, repositoryId, utils.repositoryPreferences.getBranchVisibility]);


  const updatePreferences = useCallback(
    (newData: Partial<RepositoryPreferences>) => {
      const newPreferences = {...preferences, ...newData};

      utils.repositoryPreferences.get.setData({repositoryId}, newPreferences);

      trpcRaw.repositoryPreferences.set.mutate(
        {
          repositoryId,
          preferences: newPreferences
        }
      );
    },
    [preferences, repositoryId, utils]
  );

  const value = useMemo(
    () => ({
      preferences,
      updatePreferences,
      isFetching
    }),
    [preferences, updatePreferences, isFetching]
  );

  return (
    <RepositoryPreferencesContext.Provider value={value}>
      <RepositoryPreferencesBranchSync
        preferences={preferences}
      />
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
