import {Stack, Text} from "@mantine/core";
import {useState} from "react";
import {
  getGroupHeadingId,
  performGrouping,
  flatten, type CardWithLocation, type CardLocation, cardCountSortedGroup
} from "../utils/cardGrouping.ts";
import {CardGroup} from "./DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "./DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";

import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useDeckDataContext} from "../context/DeckDataContext.tsx";
import {cardCount} from "@mtgit/shared";

export function GroupedCards() {
  const {displayMode, groupingMode, sortingMode, setHoveredCardImageUrl} = useDeckUiContext();

  const {filteredDeck} = useDeckDataContext();

  const {repository} = useRepositoryContext();
  const tags = repository?.tags ?? {};
  // Track currently selected card for the modal

  const groups = performGrouping(
    filteredDeck,
    groupingMode,
    sortingMode
  );

  const sections = groups;
  console.log("groups:", sections);
  const pageCards = flatten(groups);


  const [selectedCardLocation, setSelectedCardLocation] = useState<CardLocation | undefined>(undefined);


  function sameLocation(a: CardLocation, b: CardLocation | undefined): boolean {
    return (
      b !== undefined &&
      a.sectionName === b.sectionName &&
      a.groupName === b.groupName &&
      a.oracleId === b.oracleId
    );
  }

  function findByOracleId(a: CardLocation, b: CardLocation | undefined): boolean {
    return b !== undefined && a.oracleId === b.oracleId;
  }

  const selectedCardIndex: number = pageCards
    .findIndex(card => sameLocation(card.location, selectedCardLocation));

  const fallbackCardIndex: number = selectedCardIndex === -1
    ? pageCards.findIndex(card => findByOracleId(card.location, selectedCardLocation))
    : selectedCardIndex;

  // todo try removing the null coalescence in the end
  const selectedCard: CardWithLocation | undefined =
    fallbackCardIndex === -1 ? undefined : pageCards[fallbackCardIndex] ?? undefined;

  return (
    <>
      {/* Render all deck sections */}
      <Stack gap="md">
        {sections.map(section => {
          // Skip empty sections
          // if (section.cards.length === 0) {
          //   return null;
          // }

          return (
            <Stack key={section.name} gap="xs">
              {/* Section heading with card count */}
              <Text
                component="h3"
                fw={700}
                size="lg"
                id={`deck-section-${section.name.toLowerCase()}`}
                data-deck-heading="true"
              >
                {section.name} ({cardCount(filteredDeck[section.name])})
              </Text>

              {/* Render groups within the section */}
              {section.groups.map(group => (
                <Stack key={`${section.name}-${group.heading || "all"}`} gap="xs">
                  {/* Group heading if grouping is enabled */}
                  {(groupingMode !== "none" && section.name != "Commander") ? (
                    <Text
                      fw={600}
                      id={getGroupHeadingId(groupingMode, group.heading)}
                      style={groupingMode === "manaValue" ? {scrollMarginTop: "1rem"} : undefined}
                    >
                      {groupingMode === "manaValue" && group.heading !== "Lands"
                        ? `Mana Value ${group.heading}`
                        : group.heading} ({cardCountSortedGroup(group)} {cardCountSortedGroup(group) === 1 ? "card" : "cards"})
                    </Text>
                  ) : null}

                  {/* Render cards in the group */}
                  <CardGroup
                    group={group}
                    displayMode={displayMode}
                    sortingMode={sortingMode}
                    groupKey={`${section.name}-${group.heading}`}
                    onCardSelect={card => {
                      setSelectedCardLocation(card);
                    }}
                    onCardHover={setHoveredCardImageUrl}
                    sectionName={section.name}/>
                </Stack>
              ))}
            </Stack>
          );
        })}
      </Stack>

      {/* Card details modal for selected card, supports navigation */}
      <CardDetailsModal
        cards={pageCards}
        index={fallbackCardIndex}
        opened={fallbackCardIndex !== -1}
        onClose={() => {
          setSelectedCardLocation(undefined);
        }}
        onIndexChange={nextIndex => {
          setSelectedCardLocation(pageCards[nextIndex].location);
        }}
      />
    </>
  );
}
