import {Box, Grid, SimpleGrid, Stack} from "@mantine/core";
import style from "../../assets/index.module.css";
// import type {CardDisplayMode} from "../context/DeckUiContext.tsx";
import {Card} from "./Card.tsx";
import type {SortedGroup} from "../../utils/cardGrouping.ts";
import type {DeckSectionName} from "@mtgit/shared";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import type {CardSortMode} from "../../types/grouping.ts";
import {useElementSize} from "@mantine/hooks";
import {useMemo} from "react";
import {DeckGroupCardLocation} from "../../types/addressedCards.ts";

interface CardGroupProps {
  group: SortedGroup;
  sectionName: DeckSectionName;
  sortingMode?: CardSortMode;
  groupKey: string;
  onCardSelect?: (location: DeckGroupCardLocation) => void;
  onCardHover?: (imageUrl: string | null) => void;
  quicklyAdjustable?: boolean;
  rightToLeft?: boolean;
  sticky?: boolean;
  minWidth?: number;
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
  sticky = false,
  minWidth = 160
}: CardGroupProps) {
  const {displayMode} = useDeckUiContext();
  const {ref, height, width} = useElementSize();
  const columnCount = Math.floor((width / minWidth));

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
            onSelect={() => onCardSelect({
              oracle_id: card.oracle_id,
              location: {
                group: group.heading,
                section: sectionName
              }
            })}
            onHoverImage={onCardHover}
          />
        ))}
      </Stack>
    );
  }

  return (
    <SimpleGrid
      ref={ref}
      pos={"sticky"}
      bottom={sticky && isTall ? "1em" : "initial"}
      top={sticky && !isTall ? "8em" : "initial"}

      w={"100%"}

      cols={columnCount}

      spacing={0}
      verticalSpacing={0}

      mt={sticky && isTall ? "auto" : 0}
      // top={sticky ? 0 : "initial"}
      style={{
        direction: rightToLeft ? "rtl" : "initial",
        justifySelf: "flex-end"
      }}>

      {!!columnCount &&
        group.cards.map((card, index) => (
          <div style={{direction: "ltr"}} key={`${groupKey}-${card.id}`}>
            <Card
              card={card}
              displayMode={displayMode}
              onSelect={() =>
                onCardSelect({
                  oracle_id: card.oracle_id,
                  location: {
                    group: group.heading,
                    section: sectionName
                  }
                })
              }
              quicklyAdjustable={quicklyAdjustable}
              deckSection={sectionName}
            />
          </div>
        ))}

    </SimpleGrid>
  );
}
