import {useDeckContext} from "../context/DeckContext.tsx";
import style from "../assets/index.module.css";
import {
  AspectRatio,
  Box,
  Group,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import {useState} from "react";
import type {CardWithTags} from "../types/cardWithTags.ts";
import {getGroupHeadingId, groupCardsByMode, sortCardsInGroup} from "../utils/cardGrouping.ts";

export function CardGrid() {
  const {filteredDeck, displayMode, groupingMode, sortingMode, setHoveredCardImageUrl} = useDeckContext();
  const [selectedCard, setSelectedCard] = useState<CardWithTags | null>(null);
  const sections = (Object.entries(filteredDeck.sections) as Array<[string, CardWithTags[]]>).sort(
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

  const getCardImageUrl = (card: CardWithTags) => (
    card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null
  );

  const selectedCardImageUrl = selectedCard ? getCardImageUrl(selectedCard) : null;

  return (
    <>
      <Stack gap="md">
        {sections.map(([sectionName, cards]) => {

          if (cards.length === 0) {
            return null;
          }

          const effectiveGroupingMode = sectionName === "Commander" ? "none" : groupingMode;
          const groupedCards = groupCardsByMode(cards, effectiveGroupingMode);

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

              {groupedCards.map((group) => (
                <Stack key={`${sectionName}-${group.heading || "all"}`} gap="xs">
                  {effectiveGroupingMode !== "none" ? (
                    <Text
                      fw={600}
                      id={getGroupHeadingId(effectiveGroupingMode, group.heading)}
                      style={effectiveGroupingMode === "manaValue" ? {scrollMarginTop: "1rem"} : undefined}
                    >
                      {effectiveGroupingMode === "manaValue" && group.heading !== "Lands"
                        ? `Mana Value ${group.heading}`
                        : group.heading} ({group.cards.length})
                    </Text>
                  ) : null}

                  {(() => {
                    const sortedGroupCards: CardWithTags[] = sortCardsInGroup(group.cards, sortingMode);

                    return displayMode === "Text" ? (
                      <Stack className={style.cardNameList} gap="xs">
                        {sortedGroupCards.map((card: CardWithTags, index) => (
                          <Box
                            key={`${sectionName}-${group.heading}-${card.id}-${index}`}
                            className={style.cardNameItem}
                            onMouseEnter={() => setHoveredCardImageUrl(getCardImageUrl(card))}
                            onClick={() => setSelectedCard(card)}
                            style={{cursor: "pointer"}}
                          >
                            <Text>{card.name}</Text>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box className={style.grid}>
                        {sortedGroupCards.map((card: CardWithTags, index) => {
                          const imageUrl = getCardImageUrl(card);

                          if (!imageUrl) {
                            return null;
                          }

                          return (
                            <AspectRatio
                              ratio={63 / 88}
                              key={`${sectionName}-${group.heading}-${card.id}-${index}`}
                              onClick={() => setSelectedCard(card)}
                              style={{cursor: "pointer"}}
                            >
                              <img src={imageUrl} alt={card.name}/>
                            </AspectRatio>
                          );
                        })}
                      </Box>
                    );
                  })()}
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
