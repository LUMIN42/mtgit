import {Box, Text, Image, Overlay, Paper, ActionIcon, Tooltip, Stack, Loader, Group} from "@mantine/core";
import {type DeckCard, DeckSectionName, getCardImageUrls, isDeckCard} from "@mtgit/shared";
import type {OracleCard} from "@mtgit/shared/scryfall";
import {CardDisplayMode, useDeckUiContext} from "../../context/DeckUiContext.tsx";
import React, {useEffect, useState} from "react";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import CardAmountEditor from "./CardAmountEditor.tsx";
import {IconRefresh} from "@tabler/icons-react";


type CardProps = {
  card: OracleCard | DeckCard;
  displayMode?: CardDisplayMode;
  className?: string;
  onSelect?: (card: OracleCard) => void;
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
      <Group
        onMouseEnter={() => onHoverImage?.(currentFaceImageUrl)}
        justify={"space-between"}
        gap={0}
        style={{
          // outline: "1px 0 0 0 solid var(--mantine-color-gray-3)"
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          borderTop: "1px solid var(--mantine-color-gray-2)"
        }}
        mt={"-1px"}
        ml={"lg"}
        pr={"xs"}
        // withBorder
      >
        <Text style={{flex: 1, cursor: onSelect ? "pointer" : undefined}} pl={"xs"}
          py={"4px"} size={"sm"} onClick={() => onSelect?.(card)}>
          {(cardAmount ? cardAmount > 1 : false) && `${cardAmount}x`} {card.name}
        </Text>
        {
          quicklyAdjustable &&
            <CardAmountEditor branchName={selectedBranchName} oracleId={card.oracle_id} deckSection={deckSection}/>
        }
      </Group>

    );
  }

  if (!currentFaceImageUrl) {
    return null;
  }

  return (
    <Box style={{
      position: "relative", ...shellStyle,
      aspectRatio: "63 / 88",
      cursor: onSelect ? "pointer" : undefined
    }}>
      <Overlay color="black"
        opacity={1}
        zIndex={0}
        style={{backgroundColor: "black"}}
        onClick={() => onSelect?.(card)}/>

      <Stack pos={"absolute"}
        h={"100%"}
        w={"100%"}
        align={"center"}
        justify={"center"}
        onClick={() => onSelect?.(card)}>
        <Loader size={"lg"}/>
      </Stack>

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
            onClick={() => onSelect?.(card)}
            loading={"eager"}
            src={imageUrl}
            key={imageUrl}
            alt={card.name}
            width="100%"
            pos="relative"
            style={{
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
