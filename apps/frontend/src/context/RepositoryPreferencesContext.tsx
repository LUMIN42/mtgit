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
  preferences,
  updatePreferences
}: {
  preferences: RepositoryPreferences;
  updatePreferences: (p: Partial<RepositoryPreferences>) => void;
}) {
  const {repository, isLoading} = useRepositoryContext();
  const {editedBranchName: selectedBranchName, setEditedBranchName: setSelectedBranchName} = useDeckUrlManager();

  useEffect(
    () => {
      if (selectedBranchName) {
        return;
      }

      if (preferences.openBranchName) {
        setSelectedBranchName(preferences.openBranchName);
      }
      else if (repository && repository.branches && !isLoading) {
        setSelectedBranchName(Object.keys(repository.branches)[0]);
      }
    },
    [isLoading, preferences.openBranchName, repository, selectedBranchName, setSelectedBranchName]
  );

  useEffect(
    () => {
      if (!selectedBranchName) {
        return;
      }

      if (preferences.openBranchName === selectedBranchName) {
        return;
      }

      updatePreferences({openBranchName: selectedBranchName});
    },
    [preferences.openBranchName, selectedBranchName, updatePreferences]
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
  const preferencesQueryKey = useMemo(
    () => ({repositoryId: repositoryId}),
    [repositoryId]
  );

  const {data, isFetching} = trpcHooks.repositoryPreferences.get.useQuery(
    preferencesQueryKey
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
        {repositoryId: repositoryId, branchName},
        {
          hidden: preferences.hiddenBranches.includes(branchName)
        }
      );
    }
  }, [preferences.hiddenBranches, branchNames, repositoryId, utils.repositoryPreferences.getBranchVisibility]);


  const updatePreferences = useCallback(
    (newData: Partial<RepositoryPreferences>) => {
      const newPreferences = {...preferences, ...newData};

      utils.repositoryPreferences.get.setData({repositoryId: repositoryId}, newPreferences);

      trpcRaw.repositoryPreferences.set.mutate(
        {
          repositoryId: repositoryId,
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
      {
        !isFetching &&
        (<RepositoryPreferencesBranchSync
          preferences={preferences}
          updatePreferences={updatePreferences}
        />)
      }

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
