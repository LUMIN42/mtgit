import {createContext, useContext, useEffect} from "react";
import type {ReactNode} from "react";
import {DeckCardCounts, DeckSectionName, Repository} from "@mtgit/shared";
import {trpc} from "../trpcClient.ts";
import {useDeckUiContext} from "./DeckUiContext.tsx";

type RepositoryContextValue = {
  repository: Repository | null;

  selectedBranchContent: DeckCardCounts | undefined;

  setBranchValue: (branchName: string, branchValue: DeckCardCounts) => void;
  updateTag: (oracleId: string, tagName: string, value: boolean) => void;
  createBranch: (branchName: string, branchContent: DeckCardCounts) => void;
  setCardAmount: (oracleId: string, branchName: string, newAmount: number, deckSection: DeckSectionName) => void;

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
  repository: Repository;
}) {
  const utils = trpc.useUtils();

  const {selectedBranchName, setSelectedBranchName} = useDeckUiContext();

  useEffect(
    () => {
      if (selectedBranchName === null) {
        setSelectedBranchName(Object.keys(repository.branches)[0]);
      }
    }
  );

  const updateTagEndpoint = trpc.decks.setTag.useMutation({
    async onMutate(variables) {
      if (!variables) {
        return;
      }

      const {deckId, tagKey, value, oracleId} = variables;

      // 1. stop conflicting refetches
      // await utils.decks.get.cancel({deckId});

      // 2. snapshot previous state
      const previousDeck = utils.decks.get.getData({deckId});

      // 3. optimistic update
      utils.decks.get.setData({deckId}, old => {
        if (!old) {
          return old;
        }

        const current = old.tags[oracleId] ?? [];

        return {
          ...old,
          tags: {
            ...old.tags,
            [oracleId]: value
              ? [...current, tagKey]
              : current.filter(tag => tag !== tagKey)
          }
        };
      });

      // 4. return rollback context
      return {previousDeck, deckId};
    },

    onError(_err, _vars, ctx) {
      if (!ctx) {
        return;
      }

      // rollback
      utils.decks.get.setData(
        {deckId: ctx.deckId},
        ctx.previousDeck
      );
    }

    // onSettled(_data, _err, vars) {
    //   if (!vars) {
    //     return;
    //   }
    //
    // //   optional: ensure server truth
    //   utils.decks.get.invalidate({deckId: vars.deckId});
    // }
  });


  const updateDeck = trpc.decks.update.useMutation({
    onMutate: async (updatedRepo: Repository) => {
      const queryKey = {deckId: updatedRepo._id};

      await utils.decks.get.cancel(queryKey);

      const previousRepo = utils.decks.get.getData(queryKey);

      utils.decks.get.setData(queryKey, updatedRepo);

      return {
        queryKey,
        previousRepo
      };
    },

    onError: (_error, _updatedRepo, context) => {
      // rollback
      if (context?.previousRepo) {
        utils.decks.get.setData(
          context.queryKey,
          context.previousRepo
        );
      }
    }
  });


  const selectedBranchContent =
    repository && selectedBranchName
      ? repository.branches[selectedBranchName]
      : undefined;

  const setBranchValue = (
    branchName: string,
    branchValue: DeckCardCounts
  ) => {
    if (!repository) {
      return;
    }

    const repoCopy = structuredClone(repository);

    repoCopy.branches[branchName] = branchValue;

    setRepositoryValue(repoCopy);
  };

  const updateTag = async (oracleId: string, tagName: string, value: boolean) => {
    updateTagEndpoint.mutateAsync({deckId: repository._id, tagKey: tagName, oracleId, value});
  };

  const createBranch = async (
    branchName: string,
    branchContent: DeckCardCounts
  ) => {
    const newRepo = structuredClone(repository);


    newRepo.branches[branchName] = branchContent;

    await setRepositoryValue(newRepo);
    setSelectedBranchName(branchName);
  };

  const setCardAmount = async (
    oracleId: string,
    branchName: string,
    newAmount: number,
    deckSection = "Main"
  ) => {
    const repoCopy = structuredClone(repository);

    repoCopy.branches[branchName][deckSection] ??= {};

    const section = repoCopy.branches[branchName][deckSection];

    if (newAmount > 0) {
      section[oracleId] = newAmount;
    }
    else {
      delete section[oracleId];
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