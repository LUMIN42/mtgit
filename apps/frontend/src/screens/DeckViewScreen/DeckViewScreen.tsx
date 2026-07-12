import {GroupedCards} from "../../components/GroupedCards.tsx";
import {DeckViewingOptions} from "../../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {Grid, Group, Stack, Title} from "@mantine/core";

import style from "../../assets/index.module.css";
import {DeckImportModalButton} from "../../components/DeckViewScreen/DeckImportModalButton.tsx";
import {DeckDisplayModeSection} from "../../components/DeckViewScreen/DeckViewingOptions/DeckDisplayModeSection.tsx";

import {
  useDeckUiContext
} from "../../context/DeckUiContext.tsx";

import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import DeckExportModalButton from "../../components/DeckViewScreen/DeckExportModalButton.tsx";
import BranchManagementModal from "../../components/DeckViewScreen/BranchManagementModal.tsx";

export function DeckViewScreen() {
  const ui = useDeckUiContext();
  const repo = useRepositoryContext();


  const toggleDisplayMode = () => {
    ui.setDisplayMode(m => (m === "Images" ? "Text" : "Images"));
  };


  return (
    <Stack style={{maxWidth: "1500px", margin: "auto"}}>

      <Title order={1}>
        {repo.repository.name}
      </Title>

      <Group>
        <DeckImportModalButton/>
        <DeckExportModalButton/>

        <DeckDisplayModeSection
          value={ui.displayMode}
          onToggle={toggleDisplayMode}
        />

        <BranchManagementModal/>

        {/*<Button variant="default" onClick={() => ui.setViewMode("Branches")}>*/}
        {/*  View branches*/}
        {/*</Button>*/}
        {/**/}
        {/*<Button variant="default" onClick={() => setIsCreateBranchOpen(true)}>*/}
        {/*  Add branch*/}
        {/*</Button>*/}
      </Group>

      {/*<CreateBranchModal*/}
      {/*  opened={isCreateBranchOpen}*/}
      {/*  onClose={() => setIsCreateBranchOpen(false)}*/}
      {/*/>*/}

      <Grid className={style.stretchChildren} gap={"xl"}>
        <Grid.Col className={`${style.stretchMe} ${style.relative}`} span={3}>
          <DeckViewingOptions/>
        </Grid.Col>

        <Grid.Col span={9}>
          <GroupedCards/>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}