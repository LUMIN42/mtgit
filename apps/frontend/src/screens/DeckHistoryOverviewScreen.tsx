import React, {useEffect} from "react";
import {trpcHooks} from "../trpcClient.ts";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {Grid, Loader, Title, Text, Stack, Button, Center, Group, Divider} from "@mantine/core";
import {
  allDeckOracleIds,
  deckCardCount,
  DeckCardCounts,
  DeckSectionName,
  withoutIdenticalParts
} from "@mtgit/shared";
import {
  BranchSnapshot,
  BranchSnapshotSchema
  // isLegalDeck
} from "@mtgit/shared";
import {z} from "zod";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {Link, useNavigate} from "react-router-dom";

export function DeckHistoryOverviewScreen() {
  const {repository} = useRepositoryContext();
  const {selectedBranchName, displayMode, setComparisonContent} = useDeckUiContext();

  const {fetchMissingCards, partiallyReconstructedCounts, buildPartiallyReconstructedDeck} = useScryfallCache();

  const navigate = useNavigate();


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
    return <Center><Loader/></Center>;
  }

  const branchSnapshots = branchSnapshotsParsing.data
    // .filter(snapshot => isLegalDeck(buildPartiallyReconstructedDeck(snapshot.cards, repository.tags),
    //   repository.format))
  ;


  // if (historyQuery.data === undefined) {
  //   return <Loader/>;
  // }

  const diffs: {
    beforeDiff: DeckCardCounts;
    afterDiff: DeckCardCounts;

    beforeFull: DeckCardCounts;
    afterFull: DeckCardCounts;
    timestamp: Date;
  }[] = [];
  for (let i = 0; i < branchSnapshots.length - 1; i++) {
    const beforeFull: DeckCardCounts = branchSnapshots[i + 1].cards;
    const afterFull: BranchSnapshot = branchSnapshots[i];

    const newerCards = afterFull.cards;

    const [before, after] = withoutIdenticalParts(beforeFull, newerCards);
    const isEmpty = (obj: DeckCardCounts) => deckCardCount(obj) === 0;
    if (isEmpty(before) || isEmpty(after)) continue;

    diffs.push({
      beforeDiff: before,
      afterDiff: after,
      timestamp: afterFull.timestamp,
      beforeFull: beforeFull,
      afterFull: afterFull.cards
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
              <Group justify={"right"}>
                <Button variant={"subtle"} onClick={() => {
                  setComparisonContent(diff.beforeFull);
                  navigate("..");
                }}>
                  Compare to Current
                </Button>
                <Text>
                  Before:
                </Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={1}>
              {/*<Divider orientation={"vertical"} h={"100%"} mx={"auto"} w={"fit-content"}/>*/}
            </Grid.Col>
            <Grid.Col span={5}>
              <Group justify={"left"}>
                <Text>
                  After:
                </Text>
                <Button variant={"subtle"} onClick={() => {
                  setComparisonContent(diff.afterFull);
                  navigate("..");
                }}>
                  Compare to Current
                </Button>
              </Group>
            </Grid.Col>

            {
              sectionsToShow(diff.beforeDiff, diff.afterDiff)
                .map(sectionName => <>

                  {
                    sectionName as DeckSectionName !== "Main" &&
                    (
                      <Grid.Col span={12}>
                        <Title ta={"center"} order={3}>
                          {sectionName}
                        </Title>
                      </Grid.Col>
                    )
                  }


                  <Grid.Col span={5}>
                    <CardGroup
                      cards={
                        Object.values(partiallyReconstructedCounts(diff.beforeDiff[sectionName]!, repository?.tags))
                      }
                      displayMode={displayMode}
                      rightToLeft={true}
                    />
                  </Grid.Col>

                  <Grid.Col span={1}>
                    <Divider orientation={"vertical"} h={"100%"} mx={"auto"} w={"fit-content"}/>
                  </Grid.Col>

                  <Grid.Col span={5}>
                    <CardGroup
                      displayMode={displayMode}
                      cards={
                        Object.values(partiallyReconstructedCounts(diff.afterDiff[sectionName]!, repository?.tags))
                      }/>
                  </Grid.Col>

                </>)
            }
          </>
        )
      }
    </Grid>
  </Stack>;
}
