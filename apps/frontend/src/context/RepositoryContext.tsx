import {createContext, useContext, useState} from "react";
import type {ReactNode} from "react";
import type {DeckCardCounts, Repository, TagsMap} from "@mtgit/shared";
import {createEmptyRepository} from "@mtgit/shared";

/**
 * Repository state plus active branch selection.
 */
type RepositoryContextValue = {
  repository: Repository | null;
  // setRepository: (r: Repository) => void;
  selectedBranchName: string | null;
  setSelectedBranchName: (n: string | null) => void;
  selectedBranchContent: DeckCardCounts;
  setBranchValue: (branchName: string, branchValue: DeckCardCounts) => void;
  setTags: (tagsMap: TagsMap) => void;
  createBranch: (branchName: string, branchContent: DeckCardCounts) => void;
};

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

/**
 * Provides repository state and active branch selection.
 */
export function RepositoryProvider({children, initialRepository}: {
  children: ReactNode;
  initialRepository?: Repository | null;
}) {
  const [repository, setRepositoryState] = useState<Repository>(() => {
    return initialRepository ?? createEmptyRepository();
  });

  const [selectedBranchName, setSelectedBranchName] = useState<string | null>("main"); // todo fix initial state

  const setBranchValue = (branchName: string, branchValue: DeckCardCounts) => {

    const newRepo = structuredClone(repository);
    newRepo.branches[branchName] = branchValue;
    setRepositoryState(newRepo);
  };

  const selectedBranchContent = repository.branches[selectedBranchName];

  const setTags = (tagsMap: TagsMap) => {
    repository.tags = tagsMap;
    setRepositoryState(repository);
  };


  const createBranch = (branchName: string, branchContent: DeckCardCounts) => {
    repository.branches[branchName] = branchContent;
    setRepositoryState(repository);
  };


  return (
    <RepositoryContext.Provider value={{
      repository,
      // setRepository,
      selectedBranchName,
      setSelectedBranchName,
      selectedBranchContent,
      setBranchValue,
      setTags,
      createBranch
    }}>
      {children}
    </RepositoryContext.Provider>
  );
}

/**
 * Access the repository context.
 */
export function useRepositoryContext() {
  const ctx = useContext(RepositoryContext);
  if (!ctx) {
    throw new Error("useRepositoryContext must be used within RepositoryProvider");
  }

  return ctx;
}

