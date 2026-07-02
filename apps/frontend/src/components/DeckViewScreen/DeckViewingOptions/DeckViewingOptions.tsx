import {Group, Paper, ScrollArea, Stack, Box} from "@mantine/core";
import {DeckPreviewImage} from "./DeckPreviewImage.tsx";
import {CardSearchSection} from "./CardSearchSection.tsx";
import {DeckFilterSection} from "./DeckFilterSection.tsx";
import {DeckGroupingSection} from "./DeckGroupingSection.tsx";
import {DeckSortingSection} from "./DeckSortingSection.tsx";
import {DeckSectionsToc} from "./DeckSectionsToc.tsx";
import {DeckMainCountBadge} from "./DeckMainCountBadge.tsx";
import {ManaCurvePlot} from "./ManaCurvePlot.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";
import BranchSelector from "./BranchSelector.tsx";

export function DeckViewingOptions({horizontal = false}: {horizontal?: boolean}) {
  const {
    displayMode,
    hoveredCardImageUrl
  } = useDeckUiContext();


  const commonContent = (
    <>
      <DeckPreviewImage visible={displayMode !== "Images"} imageUrl={hoveredCardImageUrl}/>
      <CardSearchSection/>
      <DeckFilterSection/>
      <BranchSelector/>
      <DeckGroupingSection/>
      <DeckSortingSection/>
      <DeckMainCountBadge/>
    </>
  );

  if (horizontal) {
    return (
      <Paper
        pos="sticky"
        top={0}
        pt="sm"
        style={{
          zIndex: 3,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }}
      >
        <Paper withBorder h="100%" px={"sm"} py={"xs"}>
          {/*<ScrollArea h="100%" type="auto">*/}
          <Box>
            <Group align="flex-start" gap="xl" wrap="wrap">
              {commonContent}
            </Group>
          </Box>
          {/*</ScrollArea>*/}
        </Paper>
      </Paper>
    );
  }
  else {
    return (
      <Paper pos={"relative"} top={"-0.75rem"} h={"100%"} style={{zIndex: 3}}>
        <Paper
          pos="sticky"
          top={0}
          h="100vh"
          py={"sm"}
        >
          <Paper withBorder h="100%" px={"sm"} py={"xs"}>
            <ScrollArea h="100%" type="auto">
              <Stack align="stretch" gap="xl" justify="space-between" h="100%">
                {commonContent}
                <DeckSectionsToc/>
                <ManaCurvePlot/>
              </Stack>
            </ScrollArea>
          </Paper>
        </Paper>
      </Paper>
    );
  }
}