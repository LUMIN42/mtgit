import React, {useEffect} from "react";
import {trpc} from "../trpcClient.ts";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {Grid, Loader, Title} from "@mantine/core";
import {
  allDeckOracleIds,
  BranchSnapshot,
  BranchSnapshotSchema,
  DECK_SECTION_NAMES,
  DeckCardCounts,
  withoutIdenticalParts
} from "@mtgit/shared";
import {z} from "zod";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";

export function DeckHistoryOverviewScreen() {
  const {repository} = useRepositoryContext();
  const {selectedBranchName} = useDeckUiContext();

  const {fetchMissingCards, partiallyReconstructedCounts} = useScryfallCache();


  const historyQuery = trpc.decks.branchHistory.useQuery(
    {
      repositoryId: repository!._id,
      branchName: selectedBranchName!
    },
    {enabled: !!repository && !!selectedBranchName}
  );

  useEffect(() => {
    console.log(historyQuery.data);
  }, [historyQuery.data]);


  const branchSnapshotsParsing = z.array(BranchSnapshotSchema).safeParse(historyQuery.data);

  const allIds = branchSnapshotsParsing.success ? branchSnapshotsParsing.data
    .flatMap(snapshot => allDeckOracleIds(snapshot.cards)) : [];

  useEffect(() => {
    fetchMissingCards(allIds);
  }, [allIds]);

  if (!branchSnapshotsParsing.success || repository === null) {
    return <Loader/>;
  }

  const branchSnapshots = branchSnapshotsParsing.data;


  // if (historyQuery.data === undefined) {
  //   return <Loader/>;
  // }

  const diffs: {
    before: DeckCardCounts;
    after: DeckCardCounts;
    timestamp: Date;
  }[] = [];
  for (let i = 0; i < branchSnapshots.length - 1; i++) {
    const olderCards: DeckCardCounts = branchSnapshots[i].cards;
    const newerVersion: BranchSnapshot = branchSnapshots[i + 1];

    const newerCards = newerVersion.cards;

    const [before, after] = withoutIdenticalParts(olderCards, newerCards);

    diffs.push({
      before, after, timestamp: newerVersion.timestamp
    });
  }

  return <Grid columns={11}>
    <Grid.Col span={5}>
      Before Change:
    </Grid.Col>
    <Grid.Col span={1}>

    </Grid.Col>
    <Grid.Col span={5}>
      After Change:
    </Grid.Col>

    {
      diffs.map(diff =>
        <>
          <Title order={2}>
            {diff.timestamp.toDateString()}
          </Title>
          {DECK_SECTION_NAMES
            .filter(sectionName => [...Object.keys(diff.before), ...Object.keys(diff.after)].includes(sectionName))
            .map(sectionName => <>
              <Grid.Col span={11}>
                <Title ta={"center"} order={3}>
                  {sectionName}
                </Title>
              </Grid.Col>

              <Grid.Col span={5}>
                <CardGroup cards={
                  Object.values(partiallyReconstructedCounts(diff.before[sectionName]!, repository?.tags))
                }/>
              </Grid.Col>

              <Grid.Col span={1}/>

              <Grid.Col span={5}>
                <CardGroup cards={
                  Object.values(partiallyReconstructedCounts(diff.after[sectionName]!, repository?.tags))
                }/>
              </Grid.Col>

            </>)
          }
        </>
      )
    }
  </Grid>;
}
