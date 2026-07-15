import {Box, Text, Image, Overlay, Paper} from "@mantine/core";
import {type DeckCard, DeckSectionName, getCardImageUrl, isDeckCard} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";
import {CardDisplayMode, useDeckUiContext} from "../../context/DeckUiContext.tsx";
import React from "react";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import CardAmountEditor from "./CardAmountEditor.tsx";


type CardProps = {
  card: ScryfallOracleCard | DeckCard;
  displayMode?: CardDisplayMode;
  className?: string;
  onSelect?: (card: ScryfallOracleCard) => void;
  onHoverImage?: (imageUrl: string | null) => void;
  quicklyAdjustable?: boolean;
  actualCardCount?: number;
  deckSection?:DeckSectionName;
};


export function Card({
  card,
  displayMode = "Images",
  className,
  onSelect,
  onHoverImage,
  quicklyAdjustable = false,
  deckSection = "Main"
}: CardProps) {
  const imageUrl = getCardImageUrl(card);
  const {selectedBranchContent} = useRepositoryContext();
  const {selectedBranchName} = useDeckUiContext();


  const cardAmount: number | undefined = isDeckCard(card) ? card.count : undefined;



  if (displayMode === "Text") {
    return (
      <Box
        className={className}
        onMouseEnter={() => onHoverImage?.(imageUrl)}
        onClick={() => onSelect?.(card)}
        style={onSelect ? {cursor: "pointer"} : undefined}
      >
        <Text>{card.name}</Text>
      </Box>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <Box style={{position: "relative", width: "100%"}}>
      <Overlay color="black" opacity={1} zIndex={0} style={{backgroundColor: "black"}}/>

      <Image
        src={imageUrl}
        alt={card.name}
        width="100%"
        onClick={() => onSelect?.(card)}
        pos="relative"
        style={{
          cursor: onSelect ? "pointer" : undefined
        }}
        radius="lg"
      />

      {/*// display card amount if there's more than one of it*/}
      {(isDeckCard(card) && cardAmount !== 1 && !quicklyAdjustable) && (
        <Box
          style={{
            position: "absolute",
            top: "11%",
            right: "8%",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            color: "white",
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 1
          }}
        >
          {card.count}x
        </Box>
      )}

      {quicklyAdjustable && (
        <Paper
          bg="gray.1"
          style={{zIndex: 1}}
          pos="absolute"
          right="8%"
          top="11%"
        >
          <CardAmountEditor originalCardAmount={cardAmount} branchName={selectedBranchName!} oracleId={card.oracle_id} deckSection={deckSection}/>
        </Paper>
      )}


    </Box>
  );
}
