import {useParams} from "react-router-dom";
import {trpc} from "../../trpcClient.ts";

import {RepositoryProvider} from "../../context/RepositoryContext.tsx";
import {DeckProvider} from "../../context/DeckUiContext.tsx";


import {Center, Loader} from "@mantine/core";
import DeckViewScreenWrapperInner from "./DeckViewScreenWrapperInner.tsx";

export function DeckViewScreenWrapper() {
  const {deckId} = useParams<{deckId: string}>();

  const deckQuery = trpc.decks.get.useQuery(
    {deckId: deckId ?? ""},
    {enabled: !!deckId}
  );

  if (!deckId) {
    return null;
  }

  if (deckQuery.isLoading) {
    return (
      <Center style={{height: "100%"}}>
        <Loader/>
      </Center>
    );
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <Center style={{height: "100%"}}>
        Failed to load deck
      </Center>
    );
  }

  return (
    <RepositoryProvider repository={deckQuery.data}>
      <DeckProvider>
        <DeckViewScreenWrapperInner/>
      </DeckProvider>
    </RepositoryProvider>
  );
}