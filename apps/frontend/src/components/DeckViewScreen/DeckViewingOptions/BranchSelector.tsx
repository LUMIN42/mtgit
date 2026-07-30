import React, {useMemo} from "react";
import {Flex, Select, ActionIcon} from "@mantine/core";
import {IconArrowsLeftRight} from "@tabler/icons-react";

import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";
import {useRepositoryPreferences} from "../../../context/RepositoryPreferencesContext.tsx";

function BranchSelector() {
  const repo = useRepositoryContext();
  const uiState = useDeckUiContext();

  const branches = Object.keys(repo.repository?.branches ?? {});

  const {updatePreferences} = useRepositoryPreferences();

  const selectedBranch = uiState.selectedBranchName;
  const comparisonContent = uiState.comparisonContent;

  const comparisonContentIsString = typeof comparisonContent === "string";

  const comparisonBranchOptions = React.useMemo(
    () => {
      const result = branches.filter(b => b !== selectedBranch);

      if (!comparisonContentIsString && comparisonContent) {
        result.push("Older Version");
      }

      return result;
    },
    [branches, selectedBranch, comparisonContentIsString]
  );

  const selectedBranchOptions = useMemo(
    () => branches.filter(b => b !== comparisonContent),
    [branches, comparisonContent]
  );

  const swapBranches = () => {
    if (!selectedBranch || !comparisonContentIsString) return;

    uiState.setSelectedBranchName(comparisonContent);
    uiState.setComparisonContent(selectedBranch);
  };

  React.useEffect(() => {
    if (
      selectedBranch &&
      comparisonContentIsString &&
      selectedBranch === comparisonContent
    ) {
      uiState.setComparisonContent(null);
    }
  }, [selectedBranch, comparisonContent, uiState]);

  return (
    <Flex wrap="nowrap" align="center" gap="sm">
      <Select
        size="xs"
        label="Editing Branch"
        data={selectedBranchOptions}
        value={selectedBranch}
        onChange={value => {
          if (!value) return;

          uiState.setSelectedBranchName(value);

          updatePreferences({openBranchName: value});

          if (value === comparisonContent) {
            uiState.setComparisonContent(null);
          }
        }}
        searchable
      />

      <ActionIcon
        variant="light"
        size="sm"
        onClick={swapBranches}
        disabled={!selectedBranch || !comparisonContent}
      >
        <IconArrowsLeftRight size={16}/>
      </ActionIcon>

      <Select
        size="xs"
        label="Comparison Branch"
        data={comparisonBranchOptions}
        value={typeof comparisonContent === "string" ? comparisonContent : comparisonContent && "Older Version"}
        onChange={value => {
          uiState.setComparisonContent(value);
        }}
        searchable
        clearable={true}
        rightSectionPointerEvents="all"
      />
    </Flex>
  );
}

export default BranchSelector;