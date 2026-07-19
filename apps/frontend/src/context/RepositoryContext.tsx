import {createContext, useContext} from "react";
import type {ReactNode} from "react";
import {DeckCardCounts, DeckSectionName, Repository} from "@mtgit/shared";
import {trpcHooks} from "../trpcClient.ts";
import {useDeckUiContext} from "./DeckUiContext.tsx";

type RepositoryContextValue = {
  repository: Repository;

  selectedBranchContent: DeckCardCounts | undefined;

  setBranchValue: (branchName: string, branchValue: DeckCardCounts) => void;
  updateTag: (oracleId: string, tagName: string, value: boolean) => void;
  createBranch: (branchName: string, branchContent: DeckCardCounts) => void;
  setCardAmount: (oracleId: string, branchName: string, newAmount: number, deckSection: DeckSectionName) => void;
  updateRepository: (change: Partial<Repository>) => void;

  setRepositoryValue: (repository: Repository) => void;
};

const RepositoryContext = createContext<RepositoryContextValue | undefined>(
  undefined
);

export function RepositoryProvider({
  children,
  repositoryId
}: {
  children: ReactNode;
  repositoryId: string;
}) {
  const utils = trpcHooks.useUtils();

  const {selectedBranchName, setSelectedBranchName} = useDeckUiContext();

  const deckQuery = trpcHooks.decks.get.useQuery(
    {deckId: repositoryId}
  );

  const repository: Repository = deckQuery.data ?? {
    _id: repositoryId, branches: {}, format: "Standard", name: "", owner_id: "", tags: {}
  };

  const updateTagEndpoint = trpcHooks.decks.setTag.useMutation({
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


  const updateDeck = trpcHooks.decks.update.useMutation({
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

  function updateRepository(change: Partial<Repository>) {
    if (repository !== null) {
      setRepositoryValue(
        {
          ...repository,
          ...change
        }
      );
    }
  }


  const selectedBranchContent =
    repository && selectedBranchName
      ? repository.branches[selectedBranchName] ?? {}
      : {};

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
    updateTagEndpoint.mutateAsync(
      {deckId: repository._id, tagKey: tagName, oracleId, value}
    );
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

        setRepositoryValue,
        updateRepository
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