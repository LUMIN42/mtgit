import {Grid, Stack} from "@mantine/core";
import style from "../../assets/index.module.css";
import {Card} from "./Card.tsx";
import type {DeckSectionName, TaggedCard} from "@mtgit/shared";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import type {CardSortMode} from "../../types/grouping.ts";
import {useElementSize} from "@mantine/hooks";
import {useMemo} from "react";
import {DeckGroupCardLocation} from "../../types/addressedCards.ts";

interface CardGroupProps {
  cards: TaggedCard[];
  sectionName?: DeckSectionName;
  sortingMode?: CardSortMode;
  groupKey?: string;
  onCardSelect?: (location: DeckGroupCardLocation) => void;
  onCardHover?: (imageUrl: string | null) => void;
  quicklyAdjustable?: boolean;
  rightToLeft?: boolean;
  sticky?: boolean;
  minWidth?: number;
  widthOverride?: number | undefined;
}

export function CardGroup({
  cards,
  sectionName = undefined,
  groupKey = "",
  onCardSelect = () => {
  },
  onCardHover = () => {
  },
  quicklyAdjustable = false,
  rightToLeft = false,
  sticky = false,
  minWidth = 160,
  widthOverride
}: CardGroupProps) {
  const {displayMode} = useDeckUiContext();
  const {ref, height, width} = useElementSize();


  const calculationWidth = widthOverride ?? width;
  let columnCount = Math.floor(calculationWidth / minWidth);
  if (columnCount === 0 && calculationWidth > 0) columnCount = 1;

  const isTall = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return height >= window.innerHeight * 0.9;
  }, [height]);

  if (displayMode === "Text") {
    return (
      <Stack w={"100%"} gap="xs">
        {cards.map((card, index) => (
          <Card
            key={`${sectionName}-${groupKey}-${card.id}-${index}`}
            card={card}
            displayMode={displayMode}
            className={style.cardNameItem}
            onSelect={() => onCardSelect({
              oracle_id: card.oracle_id,
              location: {
                group: groupKey,
                section: sectionName ?? null
              }
            })}
            onHoverImage={onCardHover}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Grid
      ref={ref}
      pos={"sticky"}
      bottom={sticky && isTall ? "1em" : "initial"}
      top={sticky && !isTall ? "8em" : "initial"}

      w={"100%"}
      justify={rightToLeft ? "right" : "left"}
      gap={0}
      columns={columnCount}


      mt={sticky && isTall ? "auto" : 0}

      // top={sticky ? 0 : "initial"}
      style={{
        justifySelf: "flex-end",
        justifyContent: "end"
      }}>

      {!!columnCount &&
        cards.map((card) => (
          <Grid.Col key={card.oracle_id} span={1}>
            <Card
              card={card}
              displayMode={displayMode}
              onSelect={() =>
                onCardSelect({
                  oracle_id: card.oracle_id,
                  location: {
                    group: groupKey,
                    section: sectionName ?? null
                  }
                })
              }
              quicklyAdjustable={quicklyAdjustable}
              deckSection={sectionName}
            />
          </Grid.Col>
        ))}

    </Grid>
  );
}
