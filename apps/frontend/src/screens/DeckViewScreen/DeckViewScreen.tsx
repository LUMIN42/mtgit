import {GroupedCards} from "../../components/GroupedCards.tsx";
import {DeckViewingOptions} from "../../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {Button, Grid, Group, Select, Stack, Title} from "@mantine/core";
import {useState} from "react";

import style from "../../assets/index.module.css";
import {DeckImportModal} from "../../components/DeckViewScreen/DeckImportModal.tsx";
import {DeckDisplayModeSection} from "../../components/DeckViewScreen/DeckViewingOptions/DeckDisplayModeSection.tsx";
import {CreateBranchModal} from "../../components/DeckViewScreen/CreateBranchModal.tsx";

import {
  useDeckUiContext
} from "../../context/DeckUiContext.tsx";

import {useRepositoryContext} from "../../context/RepositoryContext.tsx";

export function DeckViewScreen() {
  const ui = useDeckUiContext();
  const repo = useRepositoryContext();
  const uiState = useDeckUiContext();

  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);

  const toggleDisplayMode = () => {
    ui.setDisplayMode(m => (m === "Images" ? "Text" : "Images"));
  };

  const branches = Object.keys(repo.repository?.branches ?? {});

  return (
    <Stack>

      <Title order={1}>
        {repo.repository.name}
      </Title>

      <Group>
        <DeckImportModal/>

        <DeckDisplayModeSection
          value={ui.displayMode}
          onToggle={toggleDisplayMode}
        />

        <Button variant="default" onClick={() => ui.setViewMode("Branches")}>
          View branches
        </Button>

        <Button variant="default" onClick={() => setIsCreateBranchOpen(true)}>
          Add branch
        </Button>

        <Select
          label="Branch:"
          p="xs"
          data={branches}
          value={repo.selectedBranchName}
          onChange={value => repo.setSelectedBranchName(value)}
          searchable
        />

        <Select
          label="Comparison branch:"
          p="xs"
          data={[...branches.filter(b => b !== repo.selectedBranchName), "None"]}
          value={uiState.comparisonBranchName ?? "None"}
          onChange={value =>
            uiState.setComparisonBranchName(
              value === "None" ? undefined : value
            )
          }
          searchable
        />
      </Group>

      <CreateBranchModal
        opened={isCreateBranchOpen}
        onClose={() => setIsCreateBranchOpen(false)}
      />

      <Grid className={style.stretchChildren}>
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