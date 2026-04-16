import {useDeckContext} from "../context/DeckContext.tsx";
import {
  Stack,
  Text,
} from "@mantine/core";
import {useState} from "react";
import type {CardWithTags} from "../types/cardWithTags.ts";
import {getGroupHeadingId, groupCardsByMode} from "../utils/cardGrouping.ts";
import {CardGroup} from "./CardGroup.tsx";
import {CardDetailsModal, type CardDetailsModalCard} from "./CardDetailsModal.tsx";

export function GroupedCards() {
  const {filteredDeck, displayMode, groupingMode, sortingMode, setHoveredCardImageUrl} = useDeckContext();
  const [selection, setSelection] = useState<{cards: CardDetailsModalCard[]; index: number} | null>(null);

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

  return (
    <>
      <Stack gap="md">
        {sectionEntries.map(([sectionName, cards]) => {

          if (cards.length === 0) {
            return null;
          }

          const sectionGroupingMode = sectionName === "Commander" ? "none" : groupingMode;
          const sectionGroups = groupCardsByMode(cards, sectionGroupingMode);

          return (
            <Stack key={sectionName} gap="xs">
              <Text
                component="h3"
                fw={700}
                size="lg"
                id={`deck-section-${sectionName.toLowerCase()}`}
                data-deck-heading="true"
              >
                {sectionName} ({cards.length})
              </Text>

              {sectionGroups.map((group) => (
                <Stack key={`${sectionName}-${group.heading || "all"}`} gap="xs">
                  {sectionGroupingMode !== "none" ? (
                    <Text
                      fw={600}
                      id={getGroupHeadingId(sectionGroupingMode, group.heading)}
                      style={sectionGroupingMode === "manaValue" ? {scrollMarginTop: "1rem"} : undefined}
                    >
                      {sectionGroupingMode === "manaValue" && group.heading !== "Lands"
                        ? `Mana Value ${group.heading}`
                        : group.heading} ({group.cards.length})
                    </Text>
                  ) : null}

                  <CardGroup
                    cards={group.cards}
                    displayMode={displayMode}
                    sortingMode={sortingMode}
                    groupKey={`${sectionName}-${group.heading}`}
                    onCardSelect={(card, index, cardsInGroup) => setSelection({cards: cardsInGroup as CardDetailsModalCard[], index})}
                    onCardHover={setHoveredCardImageUrl}
                  />
                </Stack>
              ))}
            </Stack>
          );
        })}
      </Stack>

      <CardDetailsModal
        cards={selection?.cards ?? []}
        index={selection?.index ?? 0}
        opened={!!selection}
        onClose={() => setSelection(null)}
        onIndexChange={(index) => setSelection((current) => current ? {...current, index} : current)}
      />
    </>
  );
}
