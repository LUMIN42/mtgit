import React from "react";
import {Button, Grid, Paper, Stack, Text, TextInput} from "@mantine/core";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useDeckContext} from "../context/DeckUiContext.tsx";

function BranchViewingScreen() {
  const {repository, selectedBranchName, setSelectedBranchName, setRepository} = useRepositoryContext();
  const deck = useDeckContext();
  const branches = repository?.branches ?? [];
  const [filterText, setFilterText] = React.useState("");
  const filteredBranches = branches.filter(branch => branch.name.toLowerCase().includes(filterText.toLowerCase()));

  const handleSelectBranch = (branchName: string) => {
    setSelectedBranchName(branchName);
    deck.setViewMode("Deck");
  };

  const handleCreateBranch = () => {
    if (!repository) {
      return;
    }

    const sourceBranch = repository.branches.find(branch => branch.name === selectedBranchName)
      ?? repository.branches[0];
    if (!sourceBranch || sourceBranch.versions.length === 0) {
      return;
    }

    const latestVersion = sourceBranch.versions[sourceBranch.versions.length - 1];
    const baseName = selectedBranchName ? `${selectedBranchName}-copy` : "new-branch";
    let counter = 1;
    let newBranchName = baseName;
    const existing = new Set(repository.branches.map(branch => branch.name));
    while (existing.has(newBranchName)) {
      counter += 1;
      newBranchName = `${baseName}-${counter}`;
    }

    const newVersion = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sections: latestVersion.sections
    };

    const nextRepository = {
      ...repository,
      branches: [
        ...repository.branches,
        {
          name: newBranchName,
          rootVersion: newVersion.id,
          versions: [newVersion]
        }
      ]
    };

    setRepository(nextRepository);
    setSelectedBranchName(newBranchName);
    deck.setViewMode("Deck");
  };

  return (
    <Grid>
      <Grid.Col span={3}>
        <Paper withBorder h={"85vh"} p={"md"}>
          <Stack h={"100%"} justify={"space-between"}>

            <Stack>
              <TextInput
                placeholder="Filter branches"
                value={filterText}
                onChange={event => setFilterText(event.currentTarget.value)}
              />

              {filteredBranches.length === 0 ? (
                <Text c={"dimmed"} size={"sm"}>No branches available.</Text>
              ) : filteredBranches.map(branch => (
                <Button
                  key={branch.name}
                  variant={branch.name === selectedBranchName ? "filled" : "subtle"}
                  onClick={() => handleSelectBranch(branch.name)}
                >
                  {branch.name}
                </Button>
              ))}
            </Stack>

            <Button variant={"outline"} onClick={handleCreateBranch}>Create branch</Button>
          </Stack>
        </Paper>
      </Grid.Col>
      <Grid.Col span={9}>
        Nice graph of the whole thing
      </Grid.Col>
    </Grid>
  );
}

export default BranchViewingScreen;