import style from "../assets/index.module.css";
import {useDeckContext} from "../context/DeckContext.tsx";
import {Paper, ScrollArea, Stack} from "@mantine/core";
import {DeckPreviewImage} from "./DeckViewingUtils/DeckPreviewImage.tsx";
import {CardSearchSection} from "./DeckViewingUtils/CardSearchSection.tsx";
import {DeckFilterSection} from "./DeckViewingUtils/DeckFilterSection.tsx";
import {DeckDisplayModeSection} from "./DeckViewingUtils/DeckDisplayModeSection.tsx";
import {DeckGroupingSection} from "./DeckViewingUtils/DeckGroupingSection.tsx";
import {DeckSortingSection} from "./DeckViewingUtils/DeckSortingSection.tsx";
import {DeckSectionsToc} from "./DeckViewingUtils/DeckSectionsToc.tsx";
import {DeckMainCountBadge} from "./DeckViewingUtils/DeckMainCountBadge.tsx";
import {ManaCurvePlot} from "./ManaCurvePlot.tsx";


export function DeckViewingOptions() {
  const deckContext = useDeckContext();
  const {
    displayMode,
    setDisplayMode,
    hoveredCardImageUrl,
    groupingMode,
    setGroupingMode,
    sortingMode,
    setSortingMode,
    filteredDeck,
    cardFilterQuery,
    setCardFilterQuery,
  } = deckContext;

  const mainDeckCount = filteredDeck.sections.Main.length;


  const toggleDisplayMode = () => {
    setDisplayMode((currentMode) => (currentMode === "Images" ? "Text" : "Images"));
  };

  return (
    <Paper withBorder className={style.leftPanel}>
      <ScrollArea h={"100%"} p={"md"} type="auto">
        <Stack align="stretch" gap="xl" justify={"space-between"} h={"100%"}>
          <DeckPreviewImage visible={displayMode !== "Images"} imageUrl={hoveredCardImageUrl}/>
          <CardSearchSection/>
          <DeckFilterSection value={cardFilterQuery} onDebouncedChange={setCardFilterQuery}/>
          <DeckDisplayModeSection value={displayMode} onToggle={toggleDisplayMode}/>
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