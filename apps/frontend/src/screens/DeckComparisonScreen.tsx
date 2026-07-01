import React from "react";
import {Divider, Grid, Stack, Title} from "@mantine/core";
import {DeckViewingOptions} from "../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {withoutIdenticalParts} from "@mtgit/shared";
import {compareDecks} from "../utils/deckComparison.ts";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";

export function DeckComparisonScreen() {
  const {comparisonBranchName, groupingMode} = useDeckUiContext();
  const {repository, selectedBranchContent} = useRepositoryContext();
  const comparisonBranchContent = repository.branches[comparisonBranchName];

  const {partiallyReconstructedDeck, fetchMissingDeckCards} = useScryfallCache();


  fetchMissingDeckCards(comparisonBranchContent); // todo think through where exactly this should be called

  const [leftCardCounts, rightCardCounts] = withoutIdenticalParts(
    selectedBranchContent,
    comparisonBranchContent
  );

  const leftDeck = partiallyReconstructedDeck(leftCardCounts, repository.tags);
  const rightDeck = partiallyReconstructedDeck(rightCardCounts, repository.tags);


  const comparison = compareDecks(
    leftDeck,
    rightDeck,
    groupingMode
  );

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
                          <CardGroup group={{heading: group.heading, cards: group.leftCards}}
                            sectionName={section.sectionName}
                            groupKey={group.heading}/>
                        </Grid.Col>

                        {/*align={"center"}*/}
                        <Grid.Col span={1} key={`${section.sectionName}-${group.heading}-center`}>
                          <Divider h={"100%"} mx={"auto"} w={"fit-content"} orientation={"vertical"}/>
                        </Grid.Col>

                        <Grid.Col span={5} key={`${section.sectionName}-${group.heading}-right`}>
                          <CardGroup group={{heading: group.heading, cards: group.rightCards}}
                            sectionName={section.sectionName}
                            groupKey={group.heading}/>
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