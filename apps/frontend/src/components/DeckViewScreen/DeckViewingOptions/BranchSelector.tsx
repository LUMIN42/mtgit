import React from "react";
import {Flex, Select, ActionIcon} from "@mantine/core";
import {IconArrowsLeftRight} from "@tabler/icons-react";

import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";

function BranchSelector() {
  const repo = useRepositoryContext();
  const uiState = useDeckUiContext();

  const branches = Object.keys(repo.repository?.branches ?? {});

  const selectedBranch = repo.selectedBranchName;
  const comparisonBranch = uiState.comparisonBranchName;

  /**
   * Derived option sets (single source of truth)
   */
  const editedBranchOptions = React.useMemo(() => {
    return branches.filter(b => b !== comparisonBranch);
  }, [branches, comparisonBranch]);

  const comparisonBranchOptions = React.useMemo(() => {
    return [
      ...branches.filter(b => b !== selectedBranch),
      "None"
    ];
  }, [branches, selectedBranch]);

  /**
   * Swap logic (guarded)
   */
  const swapBranches = () => {
    if (!selectedBranch || !comparisonBranch) return;
    if (selectedBranch === comparisonBranch) return;

    repo.setSelectedBranchName(comparisonBranch);
    uiState.setComparisonBranchName(selectedBranch);
  };

  /**
   * Safety guard: never allow invalid state
   */
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
    <Flex wrap="nowrap" align="end" gap="sm">
      <Select
        label="Edited Branch:"
        p="xs"
        data={editedBranchOptions}
        value={selectedBranch}
        onChange={value => {
          if (!value) return;

          repo.setSelectedBranchName(value);

          // auto-fix invalid state immediately
          if (value === comparisonBranch)
            uiState.setComparisonBranchName(null);

        }}
        searchable
      />

      <ActionIcon
        variant="light"
        size="lg"
        onClick={swapBranches}
        disabled={!selectedBranch || !comparisonBranch}
        style={{alignSelf: "flex-end"}}
      >
        <IconArrowsLeftRight size={18}/>
      </ActionIcon>

      <Select
        label="Comparison Branch:"
        p="xs"
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