import React, {useEffect, useMemo} from "react";
import {Button, Divider, Grid, Stack, Title, Text, Skeleton} from "@mantine/core";
import {DeckViewingOptions} from "../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useCardCache} from "../context/CardCacheContext.tsx";
import {deckCardCount, type DeckCardCounts, withoutIdenticalParts} from "@mtgit/shared";
import {compareDecks, type DeckComparisonResult} from "../utils/deckComparison.ts";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import type {DeckGroupLocation} from "../types/addressedCards.ts";
import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";
import {useElementSize, useViewportSize} from "@mantine/hooks";
import {useDeckUrlManager} from "../hooks/DeckUrlManager.tsx";
import {trpcHooks} from "../trpcClient.ts";

export function DeckComparisonScreen() {
  const {
    groupingMode,
    sortingMode,
    diffsOnly,
    cardFilterQuery,
    displayMode
  } = useDeckUiContext();
  const {repository, selectedBranchContent, setBranchValue} = useRepositoryContext();

  const {editedBranchName, comparisonBranchName, comparisonSnapshotId} = useDeckUrlManager();

  useEffect(() => {
    document.title = `Branch Comparison - ${editedBranchName} x ${comparisonBranchName ?? "Older Version"}`;
  }, [editedBranchName, comparisonBranchName]);

  const snapshotQuery = trpcHooks.decks.branchSnapshot.useQuery(
    {
      repositoryId: repository._id,
      snapshotId: comparisonSnapshotId
    },
    {enabled: !!comparisonSnapshotId}
  );


  let comparisonContent: DeckCardCounts | undefined;
  if (comparisonBranchName) {
    comparisonContent = repository?.branches[comparisonBranchName];
  }
  else if (snapshotQuery.data) {
    comparisonContent = snapshotQuery.data.cards;
  }
  else {
    comparisonContent = {}; // placeholder before navigating away
  }

  const {usePartiallyReconstructedDeck, map, isFetching} = useCardCache();


  const {width: viewportWidth} = useViewportSize();

  const {width, ref} = useElementSize();
  const widthOfOneHalf = Math.floor((viewportWidth ?? width) / 11 * 5);


  const originalLeftCardCounts = useMemo(
    () => selectedBranchContent!,
    [map, editedBranchName, comparisonContent]
  );

  const originalRightCardCounts = useMemo(
    () => comparisonContent,
    [map, editedBranchName, comparisonContent]
  );

  const [leftCardCounts, rightCardCounts] = diffsOnly ? withoutIdenticalParts(
    originalLeftCardCounts,
    originalRightCardCounts
  ) : [originalLeftCardCounts, originalRightCardCounts];

  const noDifference = deckCardCount(leftCardCounts) + deckCardCount(rightCardCounts) == 0;

  const originalLeftDeck = usePartiallyReconstructedDeck(
    leftCardCounts,
    repository!.tags
  ).deck;
  const filteredLeftDeck = filterDeckByScryfallQuery(
    originalLeftDeck,
    cardFilterQuery
  );

  const originalRightDeck = usePartiallyReconstructedDeck(
    rightCardCounts,
    repository!.tags
  ).deck;
  const filteredRightDeck = filterDeckByScryfallQuery(
    originalRightDeck,
    cardFilterQuery
  );

  // todo maybe remove the other branch name from the memo
  // const originalLeftDeck: HydratedDeck = useMemo(
  //   () => {
  //     return leftDeck;
  //   },
  //   [map, editedBranchName, comparisonBranchName]
  // );
  //
  // const originalRightDeck: HydratedDeck = useMemo(
  //   () => {
  //     return rightDeck;
  //   },
  //   [map, editedBranchName, comparisonBranchName]
  // );

  const comparison = useMemo(
    () => {
      return compareDecks(
        filteredLeftDeck,
        filteredRightDeck,
        groupingMode,
        sortingMode
      );
    },
    [groupingMode, originalLeftDeck, originalRightDeck, sortingMode]
  );

  type ComparisonLocation = DeckGroupLocation & {
    half: "left" | "right";
  };

  type ComparisonCardLocation = {
    oracle_id: string;
    location: ComparisonLocation;
  };

  function flatten(comparison: DeckComparisonResult): ComparisonCardLocation[] {
    const leftGroups: ComparisonCardLocation[] = comparison.flatMap(
      section => section.groups.flatMap(
        group => group.leftCards
          .map(card => {
            return {
              oracle_id: card.oracle_id,
              location:
                {
                  section: section.sectionName,
                  group: group.heading,
                  half: "left"
                }
            };
          })
      )
    );

    const rightGroups: ComparisonCardLocation[] = comparison.flatMap(
      section =>
        section.groups.flatMap(group =>
          group.rightCards.map(card => ({
            oracle_id: card.oracle_id,
            location: {
              section: section.sectionName,
              group: group.heading,
              half: "right"
            }
          }))
        )
    );

    return [...leftGroups, ...rightGroups];
  }

  const flattened = useMemo(
    () => flatten(comparison),
    [comparison]
  );

  function selectChanged() {
    setBranchValue(editedBranchName!, originalRightCardCounts);
  }

  function selectOriginal() {
    setBranchValue(editedBranchName!, originalLeftCardCounts);
  }

  const {
    oracleId,
    openModal,
    closeModal,
    moveLeft,
    moveRight,
    hasNextLeft,
    hasNextRight
  } = useCardSelectionManager();


  // const comparison = compareDecks(
  //   leftDeck,
  //   rightDeck,
  //   groupingMode,
  //   sortingMode
  // );
  //
  // const originalComparison

  console.log("comparison:", comparison);

  // if (isFetching) {
  //   return (<Stack ref={ref}>
  //     <DeckViewingOptions horizontal={true} comparison={true}/>
  //     <Center>
  //       <Loader/>
  //     </Center>
  //   </Stack>);
  // }

  return (
    <Stack ref={ref}>
      <DeckViewingOptions horizontal={true} comparison={true}/>

      <Grid columns={11}>
        <Grid.Col span={5} style={{display: "flex", justifyContent: "flex-end"}}>
          <Button variant={"outline"} onClick={selectOriginal}>Select Original Version</Button>
        </Grid.Col>

        <Grid.Col span={1}>
          <Divider h={"100%"} mx={"auto"} w={"fit-content"} orientation={"vertical"}/>
        </Grid.Col>

        <Grid.Col span={5}>
          <Button variant={"outline"} onClick={selectChanged}>Select Comparison Version</Button>
        </Grid.Col>

        {
          noDifference && (<Grid.Col span={11}>
            <Text c={"dimmed"} ta={"center"}>
              Versions are identical. Nothing to show.
            </Text>
          </Grid.Col>)
        }

        {
          isFetching && (<>
            <Grid.Col span={5}>
              <Skeleton h={"100vh"}/>
            </Grid.Col>

            <Grid.Col span={1}>
              <Divider h={"100%"} mx={"auto"} w={"fit-content"} orientation={"vertical"}/>
            </Grid.Col>

            <Grid.Col span={5}>
              <Skeleton h={"100vh"}/>
            </Grid.Col>
          </>)
        }

        {
          widthOfOneHalf && !isFetching &&
          comparison.map(
            section => (
              <React.Fragment key={`${section.sectionName}-fragment`}>
                <Grid.Col span={11} key={section.sectionName}>
                  <Title style={{textAlign: "center"}} order={2}>{section.sectionName}</Title>
                </Grid.Col>
                {
                  section.groups.map(
                    group =>
                      (<React.Fragment key={`${section.sectionName}-${group.heading}-fragment`}>
                        <Grid.Col span={11} key={`${section.sectionName}-${group.heading}-heading`}>
                          <Title style={{textAlign: "center"}} order={3}>{group.heading}</Title>
                        </Grid.Col>


                        <Grid.Col span={5} key={`${section.sectionName}-${group.heading}-left`}>
                          <Stack pos={"relative"} h={"100%"}>
                            <CardGroup
                              cards={group.leftCards}
                              sectionName={section.sectionName}
                              groupKey={group.heading}
                              sticky={true}
                              rightToLeft={true}
                              quicklyAdjustable={true}
                              comparison={true}
                              widthOverride={widthOfOneHalf}
                              displayMode={displayMode}
                              onCardSelect={location => {
                                const loc: ComparisonCardLocation = {
                                  oracle_id: location.oracle_id,
                                  location: {
                                    ...location.location,
                                    half: "left"
                                  }
                                };
                                openModal(
                                  flattened,
                                  loc
                                );
                              }}
                            />
                          </Stack>
                        </Grid.Col>

                        {/*align={"center"}*/}
                        <Grid.Col span={1} key={`${section.sectionName}-${group.heading}-divider`}>
                          <Divider h={"100%"} mx={"auto"} w={"fit-content"} orientation={"vertical"}/>
                        </Grid.Col>

                        <Grid.Col pos={"relative"} span={5} key={`${section.sectionName}-${group.heading}-right`}>
                          <Stack pos={"relative"} h={"100%"}>
                            <CardGroup
                              cards={group.rightCards}
                              sectionName={section.sectionName}
                              groupKey={group.heading}
                              sticky={true}
                              quicklyAdjustable={true}
                              widthOverride={widthOfOneHalf}
                              displayMode={displayMode}
                              comparison={true}

                              onCardSelect={location => {
                                const loc: ComparisonCardLocation = {
                                  oracle_id: location.oracle_id,
                                  location: {
                                    ...location.location,
                                    half: "right"
                                  }
                                };
                                openModal(
                                  flattened,
                                  loc
                                );
                              }}
                            />
                          </Stack>
                        </Grid.Col>
                      </React.Fragment>)
                  )
                }
              </React.Fragment>
            )
          )
        }
      </Grid>

      {
        oracleId &&
        (
          <CardDetailsModal onClose={closeModal}
            oracle_id={oracleId}
            onPrev={moveLeft}
            onNext={moveRight}
            hasPrevious={hasNextLeft}
            hasNext={hasNextRight}/>
        )
      }

    </Stack>

  );
}