import React from "react";
import {Flex, Select} from "@mantine/core";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";

function BranchSelector() {
  const repo = useRepositoryContext();
  const branches = Object.keys(repo.repository?.branches ?? {});

  const uiState = useDeckUiContext();

  return (
    <Flex wrap={"nowrap"}>
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
            value === "None" ? null : value
          )
        }
        searchable
      />
    </Flex>
  );
}

export default BranchSelector;