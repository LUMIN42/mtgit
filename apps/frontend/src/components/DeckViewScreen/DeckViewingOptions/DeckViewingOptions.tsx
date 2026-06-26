import {Group, Paper, ScrollArea, Stack, Box} from "@mantine/core";
import {DeckPreviewImage} from "./DeckPreviewImage.tsx";
import {CardSearchSection} from "./CardSearchSection.tsx";
import {DeckFilterSection} from "./DeckFilterSection.tsx";
import {DeckGroupingSection} from "./DeckGroupingSection.tsx";
import {DeckSortingSection} from "./DeckSortingSection.tsx";
import {DeckSectionsToc} from "./DeckSectionsToc.tsx";
import {DeckMainCountBadge} from "./DeckMainCountBadge.tsx";
import {ManaCurvePlot} from "../CardDetailsModal/ManaCurvePlot.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";

export function DeckViewingOptions({horizontal = false}: {horizontal?: boolean}) {
  const {
    displayMode,
    hoveredCardImageUrl
  } = useDeckUiContext();


  const content = (
    <>
      <DeckPreviewImage visible={displayMode !== "Images"} imageUrl={hoveredCardImageUrl}/>
      <CardSearchSection/>
      <DeckFilterSection/>
      <DeckGroupingSection />
      <DeckSortingSection  />
      <DeckSectionsToc/>
      <DeckMainCountBadge/>
      <ManaCurvePlot/>
    </>
  );

  return (
    <Paper pos={"relative"} top={"-0.75rem"} h={"100%"}>
      <
        Paper
        pos="sticky"
        top={0}
        h="100vh"
        py={"sm"}
        style={{
          transition: "padding 50ms ease-out"
        }}
      >
        <Paper withBorder h="100%" px={"sm"} py={"xs"}>
          <ScrollArea h="100%" type="auto">
            <Box

            >
              {horizontal ? (
                <Group align="flex-start" gap="xl" wrap="wrap">
                  {content}
                </Group>
              ) : (
                <Stack align="stretch" gap="xl" justify="space-between" h="100%">
                  {content}
                </Stack>
              )}
            </Box>
          </ScrollArea>
        </Paper>
      </Paper>
    </Paper>

  );
}