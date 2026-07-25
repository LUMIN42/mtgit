import {Group, Paper, Stack, Box, Switch} from "@mantine/core";
import {DeckPreviewImage} from "./DeckPreviewImage.tsx";
import {CardSearchSection} from "./CardSearchSection.tsx";
import {FilterSection} from "./FilterSection.tsx";
import {DeckGroupingSection} from "./DeckGroupingSection.tsx";
import {SortingSelector} from "./SortingSelector.tsx";
import {DeckOverview} from "./DeckOverview.tsx";
import {ManaCurvePlot} from "./ManaCurvePlot.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";
import BranchSelector from "./BranchSelector.tsx";
import {FieldSection} from "./FieldSection.tsx";
import {DeckPieChart} from "../CardDetailsModal/DeckPieChart.tsx";

export function DeckViewingOptions({horizontal = false, comparison = false, narrowViewport = false}: {
  horizontal?: boolean;
  comparison?: boolean;
  narrowViewport?: boolean;
}) {
  const {
    displayMode,
    hoveredCardImageUrl,
    diffsOnly,
    setDiffsOnly,
    groupingMode
  } = useDeckUiContext();


  const commonContent = (
    <>
      <DeckPreviewImage visible={displayMode !== "Images" && !horizontal && !narrowViewport}
        imageUrl={hoveredCardImageUrl}/>
      {comparison || <CardSearchSection/>}
      <FilterSection/>
      <BranchSelector/>

      {
        comparison &&
        (<FieldSection label={"Diffs only:"}>
          <Switch
            checked={diffsOnly}
            onChange={event => setDiffsOnly(event.currentTarget.checked)}
          />
        </FieldSection>)
      }

      <DeckGroupingSection/>
      <SortingSelector/>
      <DeckOverview/>
    </>
  );

  const verticalContent = <>
    {commonContent}

    {
      groupingMode === "manaValue" && displayMode === "Images" &&
        <ManaCurvePlot/>
    }

    {
      (groupingMode !== "manaValue" && groupingMode !== "none" && displayMode === "Images") &&
        <DeckPieChart/>
    }

  </>;

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

  else if (narrowViewport) {
    return <Paper h={"fit-content"}>
      {verticalContent}
    </Paper>;
  }

  else {
    return (
      <Paper pos={"relative"} top={"-0.75rem"} h={"100%"} style={{zIndex: 3}}>
        <Paper
          pos="relative"
          top={0}
          h="100%"
          py={"sm"}
          style={{
            boxShadow: [
              "6px",              // x offset
              "0px",              // y offset
              "12px",             // blur
              "-6px",             // spread
              "rgba(0,0,0,0.25)"  // color
            ].join(" ")
          }}
          radius={0}
        >
          <Stack px={"sm"}
            py={"sm"}
            pos={"sticky"}
            top={0}
            mah={"100vh"}
            h={displayMode === "Images" ? "100vh" : "fit-content"}>
            {verticalContent}
          </Stack>
        </Paper>
      </Paper>
    );
  }
}