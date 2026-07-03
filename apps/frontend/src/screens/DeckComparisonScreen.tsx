import React, {useMemo} from "react";
import {Divider, Grid, Stack, Title} from "@mantine/core";
import {DeckViewingOptions} from "../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {DeckCardCounts, HydratedDeck, withoutIdenticalParts} from "@mtgit/shared";
import {compareDecks} from "../utils/deckComparison.ts";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";

export function DeckComparisonScreen() {
  const {comparisonBranchName, groupingMode, sortingMode, selectedBranchName} = useDeckUiContext();
  const {repository, selectedBranchContent} = useRepositoryContext();
  const comparisonBranchContent = repository.branches[comparisonBranchName];

  const {usePartiallyReconstructedDeck, map} = useScryfallCache();


  // fetchMissingDeckCards(comparisonBranchContent); // todo think through where exactly this should be called

  const [leftCardCounts, rightCardCounts] = withoutIdenticalParts(
    selectedBranchContent,
    comparisonBranchContent
  );

  const leftDeck = usePartiallyReconstructedDeck(leftCardCounts, repository.tags);
  const rightDeck = usePartiallyReconstructedDeck(rightCardCounts, repository.tags);

  // todo maybe remove the other branch name from the memo
  const originalLeftDeck: HydratedDeck = useMemo(
    () => {
      return leftDeck;
    },
    [map, selectedBranchName, comparisonBranchName]
  );

  const originalRightDeck: HydratedDeck = useMemo(
    () => {
      return rightDeck;
    },
    [map, selectedBranchName, comparisonBranchName]
  );

  const comparison = useMemo(
    () => {
      return compareDecks(
        originalLeftDeck,
        originalRightDeck,
        groupingMode,
        sortingMode
      );
    },
    [groupingMode, originalLeftDeck, originalRightDeck, sortingMode]
  );


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
      <DeckViewingOptions horizontal={true}/>
      <Grid columns={11}>
        {
          comparison.map(
            section => (
              <>
                <Grid.Col span={11} key={section.sectionName}>
                  <Title style={{textAlign: "center"}} order={2}>{section.sectionName}</Title>
                </Grid.Col>
                {
                  section.groups.map(
                    group =>
                      (<>
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
                            />
                          </Stack>
                        </Grid.Col>

                        {/*align={"center"}*/}
                        <Grid.Col span={1} key={`${section.sectionName}-${group.heading}-center`}>
                          <Divider h={"100%"} mx={"auto"} w={"fit-content"} orientation={"vertical"}/>
                        </Grid.Col>

                        <Grid.Col pos={"relative"} span={5} key={`${section.sectionName}-${group.heading}-right`}>
                          <Stack pos={"relative"} h={"100%"}>
                            <CardGroup group={{heading: group.heading, cards: group.rightCards}}
                              sectionName={section.sectionName}
                              groupKey={group.heading}
                              sticky={true}
                              quicklyAdjustable={true}
                            />
                          </Stack>
                        </Grid.Col>


                      </>)
                  )
                }
              </>
            )
          )
        }
      </Grid>
    </Stack>

  );
}