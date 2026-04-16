import style from "../assets/index.module.css";
import {useDeckContext} from "../context/DeckContext.tsx";
import {Paper, ScrollArea, Stack} from "@mantine/core";
import {DeckPreviewImage} from "./DeckViewingOptions/DeckPreviewImage.tsx";
import {CardSearchSection} from "./DeckViewingOptions/CardSearchSection.tsx";
import {DeckFilterSection} from "./DeckViewingOptions/DeckFilterSection.tsx";
import {DeckGroupingSection} from "./DeckViewingOptions/DeckGroupingSection.tsx";
import {DeckSortingSection} from "./DeckViewingOptions/DeckSortingSection.tsx";
import {DeckSectionsToc} from "./DeckViewingOptions/DeckSectionsToc.tsx";
import {DeckMainCountBadge} from "./DeckViewingOptions/DeckMainCountBadge.tsx";
import {ManaCurvePlot} from "./ManaCurvePlot.tsx";


export function DeckViewingOptions() {
  const deckContext = useDeckContext();
  const {
    displayMode,
    hoveredCardImageUrl,
    groupingMode,
    setGroupingMode,
    sortingMode,
    setSortingMode,
    filteredDeck,
  } = deckContext;

  const mainDeckCount = filteredDeck.sections.Main.length;




  return (
    <Paper withBorder className={style.leftPanel}>
      <ScrollArea h={"100%"} p={"md"} type="auto">
        <Stack align="stretch" gap="xl" justify={"space-between"} h={"100%"}>
          <DeckPreviewImage visible={displayMode !== "Images"} imageUrl={hoveredCardImageUrl}/>
          <CardSearchSection/>
          <DeckFilterSection />
          <DeckGroupingSection value={groupingMode} onChange={(value) => setGroupingMode(value)}/>
          <DeckSortingSection value={sortingMode} onChange={(value) => setSortingMode(value)}/>
          <DeckSectionsToc/>
          <DeckMainCountBadge count={mainDeckCount}/>
          <ManaCurvePlot/>
        </Stack>
      </ScrollArea>
    </Paper>
  );
}