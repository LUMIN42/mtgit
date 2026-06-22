import {createContext, useContext, useState} from "react";
import type {ReactNode} from "react";
import type {DeckCardCounts, Repository, TagsMap} from "@mtgit/shared";

type RepositoryContextValue = {
  repository: Repository | null;

  selectedBranchName: string | null;
  setSelectedBranchName: (n: string | null) => void;

  selectedBranchContent: DeckCardCounts | undefined;

  setBranchValue: (branchName: string, branchValue: DeckCardCounts) => void;
  setTags: (tagsMap: TagsMap) => void;
  createBranch: (branchName: string, branchContent: DeckCardCounts) => void;
};

const RepositoryContext = createContext<RepositoryContextValue | undefined>(
  undefined
);

export function RepositoryProvider({
  children,
  repository
}: {
  children: ReactNode;
  repository: Repository | null;
}) {
  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(
    "main"
  );

  const selectedBranchContent =
    repository && selectedBranchName
      ? repository.branches[selectedBranchName]
      : undefined;

  /**
   * ⚠️ TEMP IMPLEMENTATION NOTES:
   * These mutate nothing for now because repository is server-owned.
   * They are kept to preserve API compatibility.
   */

  const setBranchValue = (
    branchName: string,
    branchValue: DeckCardCounts
  ) => {
    if (!repository) {
      return;
    }

    repository.branches[branchName] = branchValue;
  };

  const setTags = (tagsMap: TagsMap) => {
    if (!repository) {
      return;
    }

    repository.tags = tagsMap;
  };

  const createBranch = (
    branchName: string,
    branchContent: DeckCardCounts
  ) => {
    if (!repository) {
      return;
    }

    repository.branches[branchName] = branchContent;
  };

  return (
    <RepositoryContext.Provider
      value={{
        repository,

        selectedBranchName,
        setSelectedBranchName,

        selectedBranchContent,

        setBranchValue,
        setTags,
        createBranch
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositoryContext() {
  const ctx = useContext(RepositoryContext);
  if (!ctx) {
    throw new Error(
      "useRepositoryContext must be used within RepositoryProvider"
    );
  }
  return ctx;
}