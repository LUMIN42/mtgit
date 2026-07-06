import React from "react";
import {Flex, Select, ActionIcon} from "@mantine/core";
import {IconArrowsLeftRight} from "@tabler/icons-react";

import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";

function BranchSelector() {
  const repo = useRepositoryContext();
  const uiState = useDeckUiContext();

  const branches = Object.keys(repo.repository?.branches ?? {});

  const selectedBranch = uiState.selectedBranchName;
  const comparisonBranch = uiState.comparisonBranchName;

  const editedBranchOptions = React.useMemo(() => {
    return branches.filter(b => b !== comparisonBranch);
  }, [branches, comparisonBranch]);

  const comparisonBranchOptions = React.useMemo(() => {
    return [
      ...branches.filter(b => b !== selectedBranch),
      "None"
    ];
  }, [branches, selectedBranch]);

  const swapBranches = () => {
    if (!selectedBranch || !comparisonBranch) return;
    if (selectedBranch === comparisonBranch) return;

    uiState.setSelectedBranchName(comparisonBranch);
    uiState.setComparisonBranchName(selectedBranch);
  };

  React.useEffect(() => {
    if (
      selectedBranch &&
      comparisonBranch &&
      selectedBranch === comparisonBranch
    ) {
      uiState.setComparisonBranchName(null);
    }
  }, [selectedBranch, comparisonBranch, uiState]);

  return (
    <Flex wrap="nowrap" align="center" gap="sm">
      <Select
        size="xs"
        label="Editing Branch"
        data={editedBranchOptions}
        value={selectedBranch}
        onChange={value => {
          if (!value) return;

          uiState.setSelectedBranchName(value);

          if (value === comparisonBranch) {
            uiState.setComparisonBranchName(null);
          }
        }}
        searchable
      />

      <ActionIcon
        variant="light"
        size="sm"
        onClick={swapBranches}
        disabled={!selectedBranch || !comparisonBranch}
      >
        <IconArrowsLeftRight size={16}/>
      </ActionIcon>

      <Select
        size="xs"
        label="Comparison Branch"
        data={comparisonBranchOptions}
        value={comparisonBranch ?? "None"}
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