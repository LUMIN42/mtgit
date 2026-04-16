import {Box, Text, Image, Overlay} from "@mantine/core";
import {getCardImageUrl} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";
import type {CardDisplayMode} from "../context/DeckContext.tsx";


type CardProps = {
  card: ScryfallOracleCard;
  displayMode?: CardDisplayMode;
  className?: string;
  onSelect?: (card: ScryfallOracleCard) => void;
  onHoverImage?: (imageUrl: string | null) => void;
}


export function Card({
  card,
  displayMode = "Images",
  className,
  onSelect,
  onHoverImage,
}: CardProps) {
  const imageUrl = getCardImageUrl(card);

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
      <Overlay color="black" opacity={1} zIndex={0} style={{ backgroundColor: "black" }} />
      <Image
        src={imageUrl}
        alt={card.name}
        width="100%"
        onClick={() => onSelect?.(card)}
        pos={"relative"}
        style={{
          cursor: onSelect ? "pointer" : undefined,
        }}
        radius="lg"
      />
    </Box>
  );
}
