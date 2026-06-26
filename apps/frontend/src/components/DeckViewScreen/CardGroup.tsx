import {Box, Stack} from "@mantine/core";
import style from "../../assets/index.module.css";
// import type {CardDisplayMode} from "../context/DeckUiContext.tsx";
import {Card} from "./Card.tsx";
import type {CardLocation, SortedGroup} from "../../utils/cardGrouping.ts";
import type {DeckSectionName} from "@mtgit/shared";
import type {CardDisplayMode} from "../../context/DeckUiContext.tsx";
import type {CardSortMode} from "../../types/grouping.ts";

interface CardGroupProps {
  group: SortedGroup;
  sectionName: DeckSectionName;
  displayMode: CardDisplayMode;
  sortingMode?: CardSortMode;
  groupKey: string;
  onCardSelect?: (location: CardLocation) => void;
  onCardHover?: (imageUrl: string | null) => void;
  quicklyAdjustable?: boolean;
}

export function CardGroup({
  group,
  sectionName,
  displayMode,
  groupKey,
  onCardSelect = () => {
  },
  onCardHover = () => {
  },
  quicklyAdjustable = false
}: CardGroupProps) {

  if (displayMode === "Text") {
    return (
      <Stack className={style.cardNameList} gap="xs">
        {group.cards.map((card, index) => (
          <Card
            key={`${groupKey}-${card.id}-${index}`}
            card={card}
            displayMode={displayMode}
            className={style.cardNameItem}
            onSelect={() => onCardSelect({oracleId: card.oracle_id, groupName: group.heading, sectionName})}
            onHoverImage={onCardHover}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Box className={style.grid}>
      {group.cards.map((card, index) => (
        <Card
          key={`${groupKey}-${card.id}-${index}`}
          card={card}
          displayMode={displayMode}
          onSelect={() => onCardSelect({oracleId: card.oracle_id, groupName: group.heading, sectionName})}
          quicklyAdjustable={quicklyAdjustable}
        />
      ))}
    </Box>
  );
}
