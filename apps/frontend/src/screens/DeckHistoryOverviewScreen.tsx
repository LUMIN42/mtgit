import React, {useEffect} from "react";
import {trpcHooks} from "../trpcClient.ts";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {Divider, Grid, Loader, Title, Text, Stack, Button} from "@mantine/core";
import {
  allDeckOracleIds,
  BranchSnapshot,
  BranchSnapshotSchema,
  DeckCardCounts, DeckSectionName, isLegalDeck,
  withoutIdenticalParts
} from "@mtgit/shared";
import {z} from "zod";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {Link} from "react-router-dom";

export function DeckHistoryOverviewScreen() {
  const {repository} = useRepositoryContext();
  const {selectedBranchName} = useDeckUiContext();

  const {fetchMissingCards, partiallyReconstructedCounts, buildPartiallyReconstructedDeck} = useScryfallCache();


  const historyQuery = trpcHooks.decks.branchHistory.useQuery(
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

  const branchSnapshots = branchSnapshotsParsing.data
    .filter(snapshot => isLegalDeck(buildPartiallyReconstructedDeck(snapshot.cards, repository.tags),
      repository.format));


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

  function sectionsToShow(deck1: DeckCardCounts, deck2: DeckCardCounts) {
    const output: string[] = [];

    for (const [sectionName, sectionContent] of Object.entries(deck1)) {
      if (Object.keys(sectionContent).length > 0 && Object.keys(deck2[sectionName] ?? []).length > 0) {
        output.push(sectionName);
      }
    }

    return output;
  }

  function formatDate(date: Date): string {
    const now = new Date();

    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isToday) {
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isThisYear) {
      return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short"
      });
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  return <Stack>
    <Button component={Link} to={".."} w={"fit-content"}>
      Return to Deck
    </Button>

    <Title order={1} ta={"center"}>
      History of {selectedBranchName} branch
    </Title>

    <Grid columns={11}>

      {diffs.length === 0 && <Text w={"100%"} ta={"center"} c={"dimmed"}>(nothing to show)</Text>}
      {
        diffs.map(diff =>
          <>
            <Grid.Col span={11}>
              <Title order={2} ta={"center"}>
                {
                  formatDate(diff.timestamp)
                }
              </Title>
            </Grid.Col>

            <Grid.Col span={5}>
              <Text ta={"right"}>
                Before:
              </Text>
            </Grid.Col>
            <Grid.Col span={1}>

            </Grid.Col>
            <Grid.Col span={5}>
              <Text>
                After:
              </Text>
            </Grid.Col>

            {
              sectionsToShow(diff.before, diff.after)
                .map(sectionName => <>

                  {
                    sectionName as DeckSectionName !== "Main" &&
                    (
                      <Grid.Col span={11}>
                        <Title ta={"center"} order={3}>
                          {sectionName}
                        </Title>
                      </Grid.Col>
                    )
                  }


                  <Grid.Col span={5}>
                    <CardGroup
                      cards={
                        Object.values(partiallyReconstructedCounts(diff.before[sectionName]!, repository?.tags))
                      }
                      rightToLeft={true}
                    />
                  </Grid.Col>

                  <Grid.Col span={1}>
                    <Divider orientation={"vertical"}/>
                  </Grid.Col>

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
    </Grid>
  </Stack>

    ;
}
