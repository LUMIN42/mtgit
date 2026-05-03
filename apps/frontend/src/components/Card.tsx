import {Box, Text, Image, Overlay} from "@mantine/core";
import {type DeckCard, getCardImageUrl, isDeckCard} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";
import type {CardDisplayMode} from "../context/DeckUiContext.tsx";
import {couch} from "globals";


type CardProps = {
  card: ScryfallOracleCard | DeckCard;
  displayMode?: CardDisplayMode;
  className?: string;
  onSelect?: (card: ScryfallOracleCard) => void;
  onHoverImage?: (imageUrl: string | null) => void;
};


export function Card({
  card,
  displayMode = "Images",
  className,
  onSelect,
  onHoverImage
}: CardProps) {
  const imageUrl = getCardImageUrl(card);
  
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
      
      // display card amount if there's more than one of it
      {(isDeckCard(card) && cardAmount !== 1) && (
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
    </Box>
  );
}
