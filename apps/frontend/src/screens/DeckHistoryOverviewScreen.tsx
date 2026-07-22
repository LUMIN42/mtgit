import React, {useEffect} from "react";
import {trpcHooks} from "../trpcClient.ts";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {
  Grid,
  Loader,
  Title,
  Text,
  Stack,
  Button,
  Center,
  Group,
  Divider,
  Switch
} from "@mantine/core";
import {
  allDeckOracleIds, DECK_SECTION_NAMES,
  deckCardCount,
  DeckCardCounts,
  DeckSectionName, isLegalDeck, OracleId,
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
import {useRepositoryPreferences} from "../context/RepositoryPreferencesContext.tsx";

export function DeckHistoryOverviewScreen() {
  const {repository} = useRepositoryContext();
  const {selectedBranchName, displayMode, setComparisonContent} = useDeckUiContext();

  const {preferences, updatePreferences} = useRepositoryPreferences();
  const compressed = preferences.compressedHistory;
  const legalOnly = preferences.legalOnlyHistory;

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

  let branchSnapshots = branchSnapshotsParsing.data
  // .filter(snapshot => isLegalDeck(buildPartiallyReconstructedDeck(snapshot.cards, repository.tags),
  //   repository.format))
  ;

  if (legalOnly) {
    branchSnapshots = branchSnapshots.filter(
      snapshot => isLegalDeck(buildPartiallyReconstructedDeck(snapshot.cards, {}), repository.format)
    );
  }

  let diffs = toDiffs(branchSnapshots);

  if (compressed) {
    diffs = compress(diffs);
  }

  type Diff = {
    beforeDiff: DeckCardCounts;
    afterDiff: DeckCardCounts;

    beforeFull: DeckCardCounts;
    afterFull: DeckCardCounts;
    beforeTimestamp: Date;
    afterTimestamp: Date;
  };

  function toDiffs(branchSnapshots: BranchSnapshot[]) {
    const diffs: Diff[] = [];
    for (let i = 0; i < branchSnapshots.length - 1; i++) {
      const beforeSnapshot: BranchSnapshot = branchSnapshots[i + 1];
      const afterSnapshot: BranchSnapshot = branchSnapshots[i];


      const beforeFull: DeckCardCounts = beforeSnapshot.cards;
      const afterFull: DeckCardCounts = afterSnapshot.cards;

      const [beforeDiff, afterDiff] = withoutIdenticalParts(beforeFull, afterFull);
      const isEmpty = (obj: DeckCardCounts) => deckCardCount(obj) === 0;
      if (isEmpty(beforeDiff) && isEmpty(afterDiff)) continue;

      diffs.push({
        beforeDiff,
        afterDiff,
        beforeTimestamp: beforeSnapshot.timestamp,
        afterTimestamp: afterSnapshot.timestamp,
        beforeFull,
        afterFull
      });
    }

    return diffs;
  }


  function compress(diffs: Diff[]): Diff[] {
    if (diffs.length === 0) {
      return [];
    }

    const result: Diff[] = [];

    type DeltaMap = Partial<Record<DeckSectionName, Record<OracleId, number>>>;

    let deltas: DeltaMap = {};

    let groupStart: BranchSnapshot = {
      cards: diffs[diffs.length - 1].beforeFull,
      timestamp: diffs[diffs.length - 1].beforeTimestamp
    };

    function hasConflict(diff: Diff, deltas: DeltaMap): boolean {
      for (const section of DECK_SECTION_NAMES) {
        const before = diff.beforeFull[section] ?? {};
        const after = diff.afterFull[section] ?? {};

        const cardIds = new Set<OracleId>([
          ...Object.keys(before),
          ...Object.keys(after)
        ] as OracleId[]);

        for (const cardId of cardIds) {
          const newDelta =
            (after[cardId] ?? 0) -
            (before[cardId] ?? 0);

          if (newDelta === 0) {
            continue;
          }

          const sectionDeltas = deltas[section] ?? {};
          const oldDelta = sectionDeltas[cardId] ?? 0;

          if (
            (oldDelta > 0 && newDelta < 0) ||
            (oldDelta < 0 && newDelta > 0)
          ) {
            return true;
          }
        }
      }

      return false;
    }

    function flush(end: BranchSnapshot) {
      const [beforeDiff, afterDiff] = withoutIdenticalParts(
        groupStart.cards,
        end.cards
      );

      result.push({
        beforeDiff,
        afterDiff,
        beforeFull: groupStart.cards,
        afterFull: end.cards,
        beforeTimestamp: groupStart.timestamp,
        afterTimestamp: end.timestamp
      });

      groupStart = end;
      deltas = {};
    }

    for (let i = diffs.length - 1; i >= 0; i--) {
      const diff = diffs[i];

      const hadConflict = hasConflict(diff, deltas);

      if (hadConflict) {
        flush({
          cards: diff.beforeFull,
          timestamp: diff.beforeTimestamp
        });
      }

      // Re-apply this diff to the (possibly reset) accumulator.
      for (const section of DECK_SECTION_NAMES) {
        const before = diff.beforeFull[section] ?? {};
        const after = diff.afterFull[section] ?? {};

        const cardIds = new Set<OracleId>([
          ...Object.keys(before),
          ...Object.keys(after)
        ] as OracleId[]);

        for (const cardId of cardIds) {
          const delta =
            (after[cardId] ?? 0) -
            (before[cardId] ?? 0);

          if (delta === 0) {
            continue;
          }

          const sectionDeltas = (deltas[section] ??= {});
          const newDelta = (sectionDeltas[cardId] ?? 0) + delta;

          if (newDelta === 0) {
            delete sectionDeltas[cardId];
          }
          else {
            sectionDeltas[cardId] = newDelta;
          }
        }
      }
    }

    flush({
      cards: diffs[0].afterFull,
      timestamp: diffs[0].afterTimestamp
    });

    return result.reverse();
  }

  function sectionsToShow(deck1: DeckCardCounts, deck2: DeckCardCounts) {
    const output: string[] = [];

    for (const [sectionName, sectionContent] of Object.entries(deck1)) {
      if (Object.keys(sectionContent).length > 0 || Object.keys(deck2[sectionName] ?? []).length > 0) {
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
    <Group>
      <Button component={Link} to={".."} w={"fit-content"}>
        Return to Deck
      </Button>
      <Switch
        size="xs"
        label="Compressed"
        checked={compressed}
        onChange={event =>
          updatePreferences({
            compressedHistory: event.currentTarget.checked
          })
        }
      />

      <Switch
        size="xs"
        label="Legal Only"
        checked={legalOnly}
        onChange={event =>
          updatePreferences({
            legalOnlyHistory: event.currentTarget.checked
          })
        }
      />
    </Group>


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
                  formatDate(diff.afterTimestamp)
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
                        Object.values(partiallyReconstructedCounts(diff.beforeDiff[sectionName] ?? {}, {}))
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
                        Object.values(partiallyReconstructedCounts(diff.afterDiff[sectionName] ?? {}, {}))
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
