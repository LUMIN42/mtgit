import style from "../assets/index.module.css";
import {useDeckContext} from "../context/DeckUiContext.tsx";
import {Group, Paper, ScrollArea, Stack} from "@mantine/core";
import {DeckPreviewImage} from "./DeckViewingOptions/DeckPreviewImage.tsx";
import {CardSearchSection} from "./DeckViewingOptions/CardSearchSection.tsx";
import {DeckFilterSection} from "./DeckViewingOptions/DeckFilterSection.tsx";
import {DeckGroupingSection} from "./DeckViewingOptions/DeckGroupingSection.tsx";
import {DeckSortingSection} from "./DeckViewingOptions/DeckSortingSection.tsx";
import {DeckSectionsToc} from "./DeckViewingOptions/DeckSectionsToc.tsx";
import {DeckMainCountBadge} from "./DeckViewingOptions/DeckMainCountBadge.tsx";
import {ManaCurvePlot} from "./ManaCurvePlot.tsx";


export function DeckViewingOptions({horizontal = false}: {horizontal?: boolean}) {
  const deckContext = useDeckContext();
  const {
    displayMode,
    hoveredCardImageUrl,
    groupingMode,
    setGroupingMode,
    sortingMode,
    setSortingMode,
    filteredDeck
  } = deckContext;

  const mainDeckCount = filteredDeck.sections.Main.length;

  const content = (
    <>
      <DeckPreviewImage visible={displayMode !== "Images"} imageUrl={hoveredCardImageUrl}/>
      <CardSearchSection/>
      <DeckFilterSection />
      <DeckGroupingSection value={groupingMode} onChange={value => setGroupingMode(value)}/>
      <DeckSortingSection value={sortingMode} onChange={value => setSortingMode(value)}/>
      <DeckSectionsToc/>
      <DeckMainCountBadge count={mainDeckCount}/>
      <ManaCurvePlot/>
    </>
  );

  return (
    <Paper withBorder className={style.leftPanel}>
      <ScrollArea h={"100%"} p={"md"} type="auto">
        {horizontal ? (
          <Group align="flex-start" gap="xl" wrap="wrap">
            {content}
          </Group>
        ) : (
          <Stack align="stretch" gap="xl" justify={"space-between"} h={"100%"}>
            {content}
          </Stack>
        )}
      </ScrollArea>
    </Paper>
  );
}