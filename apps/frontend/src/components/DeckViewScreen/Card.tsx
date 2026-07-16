import {Box, Text, Image, Overlay, Paper, ActionIcon, Tooltip} from "@mantine/core";
import {type DeckCard, DeckSectionName, getCardImageUrls, isDeckCard} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";
import {CardDisplayMode, useDeckUiContext} from "../../context/DeckUiContext.tsx";
import React, {useEffect, useState} from "react";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import CardAmountEditor from "./CardAmountEditor.tsx";
import {IconRefresh} from "@tabler/icons-react";


type CardProps = {
  card: ScryfallOracleCard | DeckCard;
  displayMode?: CardDisplayMode;
  className?: string;
  onSelect?: (card: ScryfallOracleCard) => void;
  onHoverImage?: (imageUrl: string | null) => void;
  quicklyAdjustable?: boolean;
  actualCardCount?: number;
  deckSection?: DeckSectionName;
  shellStyle?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
};


export function Card({
  card,
  displayMode = "Images",
  className,
  onSelect,
  onHoverImage,
  quicklyAdjustable = false,
  deckSection = "Main",
  shellStyle = {},
  imageStyle = {}
}: CardProps) {
  const imageUrls = getCardImageUrls(card);
  const {selectedBranchContent} = useRepositoryContext();
  const {selectedBranchName} = useDeckUiContext();

  const [currentFaceImageUrl, setCurrentFaceImageUrl] = useState<string>(imageUrls[0]);

  const outdatedState = !imageUrls.includes(currentFaceImageUrl);

  useEffect(() => {
    if (!currentFaceImageUrl || outdatedState) {
      setCurrentFaceImageUrl(imageUrls[0]);
    }
  }, [imageUrls]);

  function nextImage() {
    const currentIndex = imageUrls.indexOf(currentFaceImageUrl);

    const nextIndex = (currentIndex + 1) % imageUrls.length;

    setCurrentFaceImageUrl(imageUrls[nextIndex]);
  }


  const cardAmount: number | undefined = isDeckCard(card) ? card.count : undefined;


  if (displayMode === "Text") {
    return (
      <Box
        className={className}
        onMouseEnter={() => onHoverImage?.(currentFaceImageUrl)}
        onClick={() => onSelect?.(card)}
        style={onSelect ? {cursor: "pointer"} : undefined}
      >
        <Text>{card.name}</Text>
      </Box>
    );
  }

  if (!currentFaceImageUrl) {
    return null;
  }

  return (
    <Box style={{position: "relative", width: "100%", ...shellStyle}}>
      <Overlay color="black" opacity={1} zIndex={0} style={{backgroundColor: "black"}}/>

      {
        imageUrls.length > 1 &&
        (
          <Tooltip label="Flip card" openDelay={1000}>
            <ActionIcon
              pos="absolute"
              top="11.5%"
              left="8%"
              style={{
                zIndex: 4,
                backgroundColor: "#b80c"
              }}
              variant="filled"
              color="orange"
              radius="xl"
              size="lg"
              onClick={nextImage}
              aria-label="Flip card"
            >
              <IconRefresh size={18}/>
            </ActionIcon>
          </Tooltip>)
      }


      {
        imageUrls.map(
          (imageUrl, imageIdx) => <Image
            src={imageUrl}
            key={imageUrl}
            alt={card.name}
            width="100%"
            onClick={() => onSelect?.(card)}
            pos="relative"
            style={{
              cursor: onSelect ? "pointer" : undefined,
              display: (imageUrl === currentFaceImageUrl
                || outdatedState && imageIdx === 0
              ) ? "block" : "none",
              objectFit: "contain",
              ...imageStyle
            }}
            radius="lg"
          />
        )
      }

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
          <CardAmountEditor originalCardAmount={cardAmount}
            branchName={selectedBranchName!}
            oracleId={card.oracle_id}
            deckSection={deckSection}/>
        </Paper>
      )}


    </Box>
  );
}
