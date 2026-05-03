import {useDeckContext} from "../context/DeckUiContext.tsx";
import {Stack, Text} from "@mantine/core";
import {useMemo, useState} from "react";
import {
  getGroupHeadingId,
  performGrouping,
  flatten,
  type CardWithLocation, type CardLocation, groupCardCount
} from "../utils/cardGrouping.ts";
import {CardGroup} from "./CardGroup.tsx";
import {CardDetailsModal} from "./CardDetailsModal.tsx";
import {useTagsContext} from "../context/useTagsContext.ts";
import {withTags} from "@mtgit/shared";

export function GroupedCards() {
  const {filteredDeck, displayMode, groupingMode, sortingMode, setHoveredCardImageUrl} = useDeckContext();
  const {tags} = useTagsContext();
  // Track currently selected card for the modal
  
  /**
   * Memoized preparation of deck sections and a flat card list for the modal.
   */
  const {sections, pageCards} = useMemo(
    () => {
      
      const tagged = withTags(filteredDeck, tags);
      const groups = performGrouping(tagged.deck, groupingMode, sortingMode);
      return {sections: groups, pageCards: flatten(groups)};
    },
    [filteredDeck, groupingMode, sortingMode, tags]
  );
  
  
  const [selectedCardLocation, setSelectedCardLocation] = useState<CardLocation | undefined>(undefined);
  
  
  function sameLocation(a: CardLocation, b: CardLocation | undefined): boolean {
    return (
      b !== undefined &&
      a.sectionName === b.sectionName &&
      a.groupName === b.groupName &&
      a.oracleId === b.oracleId
    );
  }
  
  
  const selectedCardIndex: number = pageCards
    .findIndex(card => sameLocation(card.location, selectedCardLocation));
  
  // todo try removing the null coalescence in the end
  const selectedCard: CardWithLocation | undefined =
    selectedCardIndex === -1 ? undefined : pageCards[selectedCardIndex] ?? undefined;
  
  return (
    <>
      {/* Render all deck sections */}
      <Stack gap="md" maw={"1000px"} m={"auto"}>
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
                {section.name} ({filteredDeck.sections[section.name].getCardCount()
                
                })
              </Text>
              
              {/* Render groups within the section */}
              {section.groups.map(group => (
                <Stack key={`${section.name}-${group.heading || "all"}`} gap="xs">
                  {/* Group heading if grouping is enabled */}
                  {groupingMode !== "none" ? (
                    <Text
                      fw={600}
                      id={getGroupHeadingId(groupingMode, group.heading)}
                      style={groupingMode === "manaValue" ? {scrollMarginTop: "1rem"} : undefined}
                    >
                      {groupingMode === "manaValue" && group.heading !== "Lands"
                        ? `Mana Value ${group.heading}`
                        : group.heading} ({groupCardCount(group)})
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
        index={selectedCardIndex}
        opened={selectedCard !== undefined}
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
