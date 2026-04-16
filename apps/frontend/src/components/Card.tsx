import {AspectRatio, Box, Text} from "@mantine/core";
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
    <AspectRatio
      ratio={63 / 88}
      onClick={() => onSelect?.(card)}
      style={onSelect ? {cursor: "pointer"} : undefined}
    >
      <img src={imageUrl} alt={card.name}/>
    </AspectRatio>
  );
}

export default Card;