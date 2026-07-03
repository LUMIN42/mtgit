import {Box, Stack} from "@mantine/core";
import style from "../../assets/index.module.css";
// import type {CardDisplayMode} from "../context/DeckUiContext.tsx";
import {Card} from "./Card.tsx";
import type {CardLocation, SortedGroup} from "../../utils/cardGrouping.ts";
import type {DeckSectionName} from "@mtgit/shared";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import type {CardSortMode} from "../../types/grouping.ts";
import {useElementSize} from "@mantine/hooks";
import {useMemo} from "react";

interface CardGroupProps {
  group: SortedGroup;
  sectionName: DeckSectionName;
  sortingMode?: CardSortMode;
  groupKey: string;
  onCardSelect?: (location: CardLocation) => void;
  onCardHover?: (imageUrl: string | null) => void;
  quicklyAdjustable?: boolean;
  rightToLeft?: boolean;
  sticky?: boolean;
}

export function CardGroup({
  group,
  sectionName,
  groupKey,
  onCardSelect = () => {
  },
  onCardHover = () => {
  },
  quicklyAdjustable = false,
  rightToLeft = false,
  sticky = false
}: CardGroupProps) {

  const {displayMode} = useDeckUiContext();
  const {ref, height} = useElementSize();

  const isTall = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return height >= window.innerHeight * 0.9;
  }, [height]);

  if (displayMode === "Text") {
    return (
      <Stack w={"100%"} gap="xs">
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
    <Box
      // pos={sticky ? "sticky" : "initial"}
      ref={ref}
      pos={"sticky"}
      bottom={sticky && isTall ? "1em" : "initial"}
      top={sticky && !isTall ? "8em" : "initial"}

      mt={sticky && isTall ? "auto" : 0}
      // top={sticky ? 0 : "initial"}
      className={style.grid}
      style={{
        direction: rightToLeft ? "rtl" : "initial",
        justifySelf: "flex-end"
      }}>
      {group.cards.map((card, index) => (
        <div style={{direction: "ltr"}}>
          <Card
            key={`${groupKey}-${card.id}-${index}`}
            card={card}
            displayMode={displayMode}
            onSelect={() => onCardSelect({oracleId: card.oracle_id, groupName: group.heading, sectionName})}
            quicklyAdjustable={quicklyAdjustable}
            deckSection={sectionName}
          />
        </div>

      ))}
    </Box>
  );
}
