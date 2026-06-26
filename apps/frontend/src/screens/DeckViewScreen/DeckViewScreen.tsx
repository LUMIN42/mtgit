import {GroupedCards} from "../../components/GroupedCards.tsx";
import {DeckViewingOptions} from "../../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {Button, Grid, Group, Select, Stack} from "@mantine/core";
import {useState} from "react";

import style from "../../assets/index.module.css";
import {DeckImportModal} from "../../components/DeckViewScreen/DeckImportModal.tsx";
import {DeckDisplayModeSection} from "../../components/DeckViewScreen/DeckViewingOptions/DeckDisplayModeSection.tsx";
import {CreateBranchModal} from "../../components/DeckViewScreen/CreateBranchModal.tsx";

import {
  useDeckContext,
  useDeckUIContext
} from "../../context/DeckUiContext.tsx";

import {useRepositoryContext} from "../../context/RepositoryContext.tsx";

export function DeckViewScreen() {
  const deck = useDeckContext();
  const repo = useRepositoryContext();
  const uiState = useDeckUIContext();

  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);

  const toggleDisplayMode = () => {
    deck.setDisplayMode(m => (m === "Images" ? "Text" : "Images"));
  };

  const branches = Object.keys(repo.repository?.branches ?? {});

  return (
    <Stack>
      <Group>
        <DeckImportModal/>

        <DeckDisplayModeSection
          value={deck.displayMode}
          onToggle={toggleDisplayMode}
        />

        <Button variant="default" onClick={() => deck.setViewMode("Branches")}>
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