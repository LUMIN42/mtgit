import React, {useEffect} from "react";
import {Grid, Stack} from "@mantine/core";
import {DeckViewingOptions} from "../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {GroupedCards} from "../components/GroupedCards.tsx";
import {DeckDataProviderInner} from "../context/DeckDataContext.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";

export function DeckComparisonScreen() {
  const {comparisonBranchName} = useDeckUiContext();
  const {repository} = useRepositoryContext();
  const comparisonBranchContent = repository.branches[comparisonBranchName];

  const {partiallyReconstructedDeck, fetchMissingDeckCards} = useScryfallCache();

  useEffect(() => {
    fetchMissingDeckCards(comparisonBranchContent);
  }, [comparisonBranchContent]);

  const comparisonDeck = partiallyReconstructedDeck(comparisonBranchContent, repository.tags);

  return (
    <Stack>
      <DeckViewingOptions horizontal={true}/>
      <Grid>
        <Grid.Col span={6}>
          <GroupedCards/>
        </Grid.Col>
        <Grid.Col span={6}>
          <DeckDataProviderInner sections={comparisonBranchContent}>
            <GroupedCards/>
          </DeckDataProviderInner>
        </Grid.Col>
      </Grid>
    </Stack>

  );
}