import {createContext, useContext, useState} from "react";
import type {ReactNode} from "react";
import type {DeckCardCounts, Repository, TagsMap} from "@mtgit/shared";

type RepositoryContextValue = {
  repository: Repository | null;

  selectedBranchName: string | null;
  setSelectedBranchName: (n: string | null) => void;

  selectedBranchContent: DeckCardCounts | undefined;

  // mutations temporarily disabled
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

  // ❌ disabled for now (server-driven state approach)
  const setBranchValue = (
    _branchName: string,
    _branchValue: DeckCardCounts
  ) => {
    // TODO: reintroduce via mutation + cache invalidation
    console.warn("setBranchValue is disabled (read-only repository mode)");
  };

  const setTags = (_tagsMap: TagsMap) => {
    // TODO: reintroduce via mutation
    console.warn("setTags is disabled (read-only repository mode)");
  };

  const createBranch = (
    _branchName: string,
    _branchContent: DeckCardCounts
  ) => {
    // TODO: reintroduce via mutation
    console.warn("createBranch is disabled (read-only repository mode)");
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