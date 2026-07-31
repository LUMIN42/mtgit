import {GroupedCards} from "../../components/GroupedCards.tsx";
import {DeckViewingOptions} from "../../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {Box, Button, Flex, Group, SimpleGrid, Skeleton, Stack, Title} from "@mantine/core";

import style from "@styles/index.module.css";
import {DeckImportModalButton} from "../../components/DeckViewScreen/DeckImportModalButton.tsx";
import {DeckDisplayModeSection} from "../../components/DeckViewScreen/DeckViewingOptions/DeckDisplayModeSection.tsx";

import {
  useDeckUiContext
} from "../../context/DeckUiContext.tsx";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";

import DeckExportModalButton from "../../components/DeckViewScreen/DeckExportModalButton.tsx";
import {Link} from "react-router-dom";
import {QuickEditSwitch} from "../../components/DeckViewScreen/QuickEditSwitch.tsx";
import {useMediaQuery} from "@mantine/hooks";
import {ManaCurvePlot} from "../../components/DeckViewScreen/DeckViewingOptions/ManaCurvePlot.tsx";
import {DeckPieChart} from "../../components/DeckViewScreen/CardDetailsModal/DeckPieChart.tsx";
import {DeckManagementModalButton} from "../../components/DeckViewScreen/DeckManagementModalButton.tsx";
import {useDeckUrlManager} from "../../hooks/DeckUrlManager.tsx";

export function DeckViewScreen() {
  const ui = useDeckUiContext();
  const repo = useRepositoryContext();
  const {editedBranchName} = useDeckUrlManager();
  const historySearch = editedBranchName
    ? `?${new URLSearchParams({selectedBranchName: editedBranchName})}`
    : "";

  const toggleDisplayMode = () => {
    ui.setDisplayMode(m => (m === "Images" ? "Text" : "Images"));
  };

  const verticalized = useMediaQuery("(max-width: 900px)");


  return (
    <Stack style={{maxWidth: "1400px", margin: "auto"}}>
      {
        repo.repository?.name ? (
          <Title order={1}>{repo.repository.name}</Title>
        ) : (
          <Title order={1}>
            <Skeleton height="1.1em" width="10em" />
          </Title>
        )
      }
      <Group>
        <DeckImportModalButton/>
        <DeckExportModalButton/>

        <DeckDisplayModeSection
          value={ui.displayMode}
          onToggle={toggleDisplayMode}
        />

        <Button
          variant={"default"}
          component={Link}
          to={{pathname: "history", search: historySearch}}
        >
          Branch History
        </Button>

        <DeckManagementModalButton/>

        <QuickEditSwitch/>
      </Group>

      {/*<CreateBranchModal*/}
      {/*  opened={isCreateBranchOpen}*/}
      {/*  onClose={() => setIsCreateBranchOpen(false)}*/}
      {/*/>*/}

      <Flex
        gap="xl"
        direction={verticalized ? "column" : "row"}
        align="stretch"
        className={style.stretchChildren}
      >
        <Box
          w={verticalized ? "100%" : "20rem"}
          className={`${style.stretchMe} ${style.relative}`}
          style={{flexShrink: 0}}
        >
          <DeckViewingOptions narrowViewport={verticalized}/>
        </Box>

        <Box style={{flex: 1, minWidth: 0}}>
          <GroupedCards/>
        </Box>
      </Flex>


      {ui.displayMode === "Text" && (
        <SimpleGrid cols={4}>
          <ManaCurvePlot/>

          <DeckPieChart groupingMode={"color"}/>
          <DeckPieChart groupingMode={"tags"}/>
          <DeckPieChart groupingMode={"type"}/>
        </SimpleGrid>)}

    </Stack>
  );
}