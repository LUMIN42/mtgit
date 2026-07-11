import React, {useMemo} from "react";
import {Divider, Grid, Stack, Title} from "@mantine/core";
import {DeckViewingOptions} from "../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {withoutIdenticalParts} from "@mtgit/shared";
import {compareDecks, DeckComparisonResult} from "../utils/deckComparison.ts";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import {DeckGroupLocation} from "../types/addressedCards.ts";
import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";

export function DeckComparisonScreen() {
  const {
    comparisonBranchName,
    groupingMode,
    sortingMode,
    selectedBranchName,
    diffsOnly,
    cardFilterQuery
  } = useDeckUiContext();
  const {repository, selectedBranchContent} = useRepositoryContext();
  const comparisonBranchContent = repository.branches[comparisonBranchName];

  const {usePartiallyReconstructedDeck, map} = useScryfallCache();


  const originalLeftCardCounts = useMemo(
    () => selectedBranchContent,
    [map, selectedBranchName, comparisonBranchName]
  );

  const originalRightCardCounts = useMemo(
    () => comparisonBranchContent,
    [map, selectedBranchName, comparisonBranchName]
  );

  const [leftCardCounts, rightCardCounts] = diffsOnly ? withoutIdenticalParts(
    originalLeftCardCounts,
    originalRightCardCounts
  ) : [originalLeftCardCounts, originalRightCardCounts];


  const originalLeftDeck = usePartiallyReconstructedDeck(
    leftCardCounts,
    repository.tags
  );
  const filteredLeftDeck = filterDeckByScryfallQuery(
    originalLeftDeck,
    cardFilterQuery
  );

  const originalRightDeck = usePartiallyReconstructedDeck(
    rightCardCounts,
    repository.tags
  );
  const filteredRightDeck = filterDeckByScryfallQuery(
    originalRightDeck,
    cardFilterQuery
  );

  // todo maybe remove the other branch name from the memo
  // const originalLeftDeck: HydratedDeck = useMemo(
  //   () => {
  //     return leftDeck;
  //   },
  //   [map, selectedBranchName, comparisonBranchName]
  // );
  //
  // const originalRightDeck: HydratedDeck = useMemo(
  //   () => {
  //     return rightDeck;
  //   },
  //   [map, selectedBranchName, comparisonBranchName]
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


  return (
    <Stack>
      <DeckViewingOptions horizontal={true} comparison={true}/>
      <Grid columns={11}>
        {
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
                            <CardGroup group={{heading: group.heading, cards: group.leftCards}}
                              sectionName={section.sectionName}
                              groupKey={group.heading}
                              sticky={true}
                              rightToLeft={true}
                              quicklyAdjustable={true}
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
                            <CardGroup group={{heading: group.heading, cards: group.rightCards}}
                              sectionName={section.sectionName}
                              groupKey={group.heading}
                              sticky={true}
                              quicklyAdjustable={true}

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

      <CardDetailsModal onClose={closeModal}
        oracle_id={oracleId}
        onPrev={moveLeft}
        onNext={moveRight}
        hasPrevious={hasNextLeft}
        hasNext={hasNextRight}/>
    </Stack>

  );
}