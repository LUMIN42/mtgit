import {useDeckContext} from "../context/DeckUiContext.tsx";
import {
  Stack,
  Text,
} from "@mantine/core";
import {useMemo, useState} from "react";
import type {CardWithTags} from "../types/cardWithTags.ts";
import {getGroupHeadingId, groupCardsByMode, sortCardsInGroup} from "../utils/cardGrouping.ts";
import {CardGroup} from "./CardGroup.tsx";
import {CardDetailsModal} from "./CardDetailsModal.tsx";

export function GroupedCards() {
  const {filteredDeck, displayMode, groupingMode, sortingMode, setHoveredCardImageUrl} = useDeckContext();
  const [selectedCard, setSelectedCard] = useState<CardWithTags | null>(null);

  const {sections, pageCards} = useMemo(() => {
    const sectionEntries = (Object.entries(filteredDeck.sections) as Array<[string, CardWithTags[]]>).sort(
      ([leftSection], [rightSection]) => {
        if (leftSection === "Commander") {
          return -1;
        }

        if (rightSection === "Commander") {
          return 1;
        }

        return 0;
      },
    );

    return sectionEntries.reduce(
      (sectionAcc, [sectionName, cards]) => {
        const sectionGroupingMode = sectionName === "Commander" ? "none" : groupingMode;
        const groupResult = groupCardsByMode(cards, sectionGroupingMode).reduce(
          (groupAcc, group) => {
            const sortedCards = sortingMode ? sortCardsInGroup(group.cards, sortingMode) : group.cards;
            const startIndex = sectionAcc.pageCards.length + groupAcc.pageCards.length;

            return {
              groups: [
                ...groupAcc.groups,
                {
                  heading: group.heading,
                  cards: sortedCards,
                  startIndex,
                },
              ],
              pageCards: [...groupAcc.pageCards, ...sortedCards],
            };
          },
          {groups: [], pageCards: [] as CardWithTags[]},
        );

        return {
          sections: [
            ...sectionAcc.sections,
            {
              sectionName,
              cards,
              sectionGroupingMode,
              groups: groupResult.groups,
            },
          ],
          pageCards: [...sectionAcc.pageCards, ...groupResult.pageCards],
        };
      },
      {sections: [], pageCards: [] as CardWithTags[]},
    );
  }, [filteredDeck.sections, groupingMode, sortingMode]);

  const safeSelection = selectedCard ? pageCards.indexOf(selectedCard) : -1;
  const hasSelection = safeSelection >= 0;

  return (
    <>
      <Stack gap="md">
        {sections.map((section) => {
          if (section.cards.length === 0) {
            return null;
          }

          return (
            <Stack key={section.sectionName} gap="xs">
              <Text
                component="h3"
                fw={700}
                size="lg"
                id={`deck-section-${section.sectionName.toLowerCase()}`}
                data-deck-heading="true"
              >
                {section.sectionName} ({section.cards.length})
              </Text>

              {section.groups.map((group) => {
                return (
                  <Stack key={`${section.sectionName}-${group.heading || "all"}`} gap="xs">
                    {section.sectionGroupingMode !== "none" ? (
                      <Text
                        fw={600}
                        id={getGroupHeadingId(section.sectionGroupingMode, group.heading)}
                        style={section.sectionGroupingMode === "manaValue" ? {scrollMarginTop: "1rem"} : undefined}
                      >
                        {section.sectionGroupingMode === "manaValue" && group.heading !== "Lands"
                          ? `Mana Value ${group.heading}`
                          : group.heading} ({group.cards.length})
                      </Text>
                    ) : null}

                    <CardGroup
                      cards={group.cards}
                      displayMode={displayMode}
                      sortingMode={sortingMode}
                      groupKey={`${section.sectionName}-${group.heading}`}
                      onCardSelect={(_, index) => setSelectedCard(pageCards[group.startIndex + index] ?? null)}
                      onCardHover={setHoveredCardImageUrl}
                    />
                  </Stack>
                );
              })}
            </Stack>
          );
        })}
      </Stack>

      <CardDetailsModal
        cards={pageCards}
        index={hasSelection ? safeSelection : 0}
        opened={hasSelection}
        onClose={() => setSelectedCard(null)}
        onIndexChange={(nextIndex) => setSelectedCard(pageCards[nextIndex] ?? null)}
      />
    </>
  );
}
