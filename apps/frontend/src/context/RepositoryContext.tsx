import {createContext, useContext, useState} from "react";
import type {ReactNode} from "react";
import type {DeckCardCounts, Repository, TagsMap} from "@mtgit/shared";
import {createEmptyRepository} from "@mtgit/shared";

type RepositoryContextValue = {
  repository: Repository;
  selectedBranchName: string | null;
  setSelectedBranchName: (n: string | null) => void;
  selectedBranchContent: DeckCardCounts | undefined;
  setBranchValue: (branchName: string, branchValue: DeckCardCounts) => void;
  setTags: (tagsMap: TagsMap) => void;
  createBranch: (branchName: string, branchContent: DeckCardCounts) => void;
};

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

export function RepositoryProvider({
  children,
  initialRepository
}: {
  children: ReactNode;
  initialRepository?: Repository | null;
}) {
  const [repository, setRepositoryState] = useState<Repository>(() => {
    return initialRepository ?? createEmptyRepository();
  });

  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(
    "main"
  );

  const setBranchValue = (branchName: string, branchValue: DeckCardCounts) => {
    setRepositoryState(prev => ({
      ...prev,
      branches: {
        ...prev.branches,
        [branchName]: branchValue
      }
    }));
  };

  const setTags = (tagsMap: TagsMap) => {
    setRepositoryState(prev => ({
      ...prev,
      tags: tagsMap
    }));
  };

  // ✅ create branch
  const createBranch = (branchName: string, branchContent: DeckCardCounts) => {
    setRepositoryState(prev => ({
      ...prev,
      branches: {
        ...prev.branches,
        [branchName]: branchContent
      }
    }));
  };

  // safe derived value
  const selectedBranchContent =
    selectedBranchName ? repository.branches[selectedBranchName] : undefined;

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
    throw new Error("useRepositoryContext must be used within RepositoryProvider");
  }
  return ctx;
}