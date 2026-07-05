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
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";

export function GroupedCards() {
  const {groupingMode, sortingMode, setHoveredCardImageUrl} = useDeckUiContext();

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
  const pageCards: CardWithLocation[] = flatten(groups);


  const {} = useCardSelectionManager(pageCards);


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
        oracle_id={selectedCardLocation.oracleId},
      onLeftArrow,
      onRightArrow,
      hasPrevious,
      hasNext,
      deckSectionName = "Main"
      />
    </>
  );
}
