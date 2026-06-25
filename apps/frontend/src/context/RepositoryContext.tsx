import {createContext, useContext, useState} from "react";
import type {ReactNode} from "react";
import type {DeckCardCounts, Repository, TagsMap} from "@mtgit/shared";
import {trpc} from "../trpcClient.ts";

type RepositoryContextValue = {
  repository: Repository | null;

  selectedBranchName: string | null;
  setSelectedBranchName: (n: string | null) => void;

  selectedBranchContent: DeckCardCounts | undefined;

  setBranchValue: (branchName: string, branchValue: DeckCardCounts) => void;
  updateTag: (oracleId: string, tagName: string, value: boolean) => void;
  createBranch: (branchName: string, branchContent: DeckCardCounts) => void;
  setCardAmount: (oracleId: string, branchName: string, newAmount: number) => void;

  setRepositoryValue: (repository: Repository) => void;
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
  const utils = trpc.useUtils();

  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(
    "main"
  );

  const updateTagEndpoint = trpc.decks.setTag
    .useMutation({
      onSuccess: () => {
        utils.decks.get.invalidate(
          {deckId: repository._id}
        );
      }
    });

  const updateDeck = trpc.decks.update
    .useMutation(
      {
        onSuccess: (updatedRepo: Repository) => {
          utils.decks.get.setData(
            {deckId: updatedRepo._id},
            updatedRepo
          );
        }
      }
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

  const updateTag = async (oracleId: string, tagName: string, value: boolean) => {
    updateTagEndpoint.mutateAsync({deckId: repository._id, tagKey: tagName, oracleId, value});
  };

  const setTags = async (tagsMap: TagsMap) => {
    const newRepository = structuredClone(repository);

    newRepository.tags = tagsMap;

    await setRepositoryValue(newRepository);
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

  const setCardAmount = async (oracleId: string, branchName: string, newAmount: number) => {
    const repoCopy = structuredClone(repository);

    if (newAmount > 0) {
      repoCopy.branches[branchName].Main[oracleId] = newAmount;

    }
    else {
      delete repoCopy.branches[branchName].Main[oracleId];

    }

    await setRepositoryValue(repoCopy);
  };

  const setRepositoryValue = async (repository: Repository) => {
    await updateDeck.mutateAsync(repository);
  };

  return (
    <RepositoryContext.Provider
      value={{
        repository,

        selectedBranchName,
        setSelectedBranchName,
        setCardAmount,

        selectedBranchContent,

        setBranchValue,
        createBranch,
        updateTag,

        setRepositoryValue
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