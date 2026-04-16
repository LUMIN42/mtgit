import {useDeckContext} from "../context/DeckContext.tsx";
import {
  Box,
  Group,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import {useState} from "react";
import type {CardWithTags} from "../types/cardWithTags.ts";
import {getGroupHeadingId, groupCardsByMode} from "../utils/cardGrouping.ts";
import {getCardImageUrl} from "@mtgit/shared";
import {CardGroup} from "./CardGroup.tsx";

export function GroupedCards() {
  const {filteredDeck, displayMode, groupingMode, sortingMode, setHoveredCardImageUrl} = useDeckContext();
  const [selectedCard, setSelectedCard] = useState<CardWithTags | null>(null);

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

  const selectedCardImageUrl = selectedCard ? getCardImageUrl(selectedCard) : null;

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
                    onCardSelect={setSelectedCard}
                    onCardHover={setHoveredCardImageUrl}
                  />
                </Stack>
              ))}
            </Stack>
          );
        })}
      </Stack>

      <Modal
        opened={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title={selectedCard?.name ?? "Card details"}
        size="80%"
      >
        {selectedCard ? (
          <Group align="flex-start" grow wrap="nowrap">
            <Box style={{maxWidth: 420, width: "100%"}}>
              {selectedCardImageUrl ? (
                <img src={selectedCardImageUrl} alt={selectedCard.name} style={{width: "100%", borderRadius: 8}}/>
              ) : (
                <Text c="dimmed">No card image available.</Text>
              )}
            </Box>

            <Stack gap={6} style={{width: "100%"}}>
              <Text fw={700}>{selectedCard.name}</Text>
              <Text size="sm"><strong>Type:</strong> {selectedCard.type_line}</Text>
              {/*<Text size="sm"><strong>Rarity:</strong> {selectedCard.rarity}</Text>*/}
              <Text size="sm"><strong>Tags:</strong> {selectedCard.tags.length ? selectedCard.tags.join(", ") : "-"}
              </Text>
              <Text size="sm" style={{whiteSpace: "pre-line"}}>
                <strong>OracleText:</strong><br/>
                {selectedCard.oracle_text || "-"}
              </Text>
            </Stack>
          </Group>
        ) : null}
      </Modal>
    </>
  );
}
