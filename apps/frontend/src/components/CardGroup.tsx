import {Box, Stack} from "@mantine/core";
import style from "../assets/index.module.css";
import type {CardDisplayMode} from "../context/DeckContext.tsx";
import type {CardWithTags} from "../types/cardWithTags.ts";
import type {CardSortMode} from "../types/grouping.ts";
import {sortCardsInGroup} from "../utils/cardGrouping.ts";
import {Card} from "./Card.tsx";

interface CardGroupProps {
  cards: CardWithTags[];
  displayMode: CardDisplayMode;
  sortingMode?: CardSortMode;
  groupKey: string;
  onCardSelect?: (card: CardWithTags) => void;
  onCardHover?: (imageUrl: string | null) => void;
}

export function CardGroup({
  cards,
  displayMode,
  sortingMode,
  groupKey,
  onCardSelect = () => {},
  onCardHover = () => {},
}: CardGroupProps) {
  const sortedCards = sortingMode ? sortCardsInGroup(cards, sortingMode) : cards;

  if (displayMode === "Text") {
    return (
      <Stack className={style.cardNameList} gap="xs">
        {sortedCards.map((card, index) => (
          <Card
            key={`${groupKey}-${card.id}-${index}`}
            card={card}
            displayMode={displayMode}
            className={style.cardNameItem}
            onSelect={onCardSelect}
            onHoverImage={onCardHover}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Box className={style.grid}>
      {sortedCards.map((card, index) => (
        <Card
          key={`${groupKey}-${card.id}-${index}`}
          card={card}
          displayMode={displayMode}
          onSelect={onCardSelect}
        />
      ))}
    </Box>
  );
}
