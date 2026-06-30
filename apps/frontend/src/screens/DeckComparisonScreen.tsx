import React from "react";
import {Grid, Stack} from "@mantine/core";
import {DeckViewingOptions} from "../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {GroupedCards} from "../components/GroupedCards.tsx";
import {DeckDataProviderInner, useDeckDataContext} from "../context/DeckDataContext.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {performGrouping} from "../utils/cardGrouping.ts";
import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";

export function DeckComparisonScreen() {
  const {comparisonBranchName} = useDeckUiContext();
  const {repository} = useRepositoryContext();
  const uiState = useDeckUiContext();
  const comparisonBranchContent = repository.branches[comparisonBranchName];

  const {partiallyReconstructedDeck, fetchMissingDeckCards} = useScryfallCache();

  const {filteredDeck} = useDeckDataContext();

  fetchMissingDeckCards(comparisonBranchContent);


  const comparisonDeck = filterDeckByScryfallQuery(
    partiallyReconstructedDeck(comparisonBranchContent, repository.tags),
    uiState.cardFilterQuery
  );

  const leftGrouping = performGrouping(partiallyReconstructedDeck, uiState.groupingMode, uiState.sortingMode);


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