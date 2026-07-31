import {useMemo} from "react";
import {Flex, Select, ActionIcon} from "@mantine/core";
import {IconArrowsLeftRight} from "@tabler/icons-react";

import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {useRepositoryPreferences} from "../../../context/RepositoryPreferencesContext.tsx";
import {
  COMPARISON_BRANCH_NAME_URL_KEY,
  EDITED_BRANCH_NAME_URL_KEY,
  useDeckUrlManager
} from "../../../hooks/DeckUrlManager.tsx";
import {useSearchParams} from "react-router-dom";

const OLDER_VERSION_OPTION = "Older Version";

function BranchSelector() {
  const {repository} = useRepositoryContext();

  const {updatePreferences} = useRepositoryPreferences();
  const {
    editedBranchName,
    comparisonBranchName,
    comparisonSnapshotId,
    setEditedBranchName,
    setComparisonBranchName
  } = useDeckUrlManager();
  const [searchParams, setSearchParams] = useSearchParams();

  const branches = Object.keys(repository.branches ?? {});

  const comparisonBranchOptions = useMemo(
    () => {
      const options = branches.filter(branchName => branchName !== editedBranchName);

      if (comparisonSnapshotId) {
        options.unshift(OLDER_VERSION_OPTION);
      }

      return options;
    },
    [branches, editedBranchName, comparisonSnapshotId]
  );

  const selectedBranchOptions = useMemo(
    () => branches.filter(branchName => branchName !== comparisonBranchName),
    [branches, comparisonBranchName]
  );

  const swapBranches = () => {
    if (!editedBranchName || !comparisonBranchName) return;

    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set(EDITED_BRANCH_NAME_URL_KEY, comparisonBranchName);
    nextSearchParams.set(COMPARISON_BRANCH_NAME_URL_KEY, editedBranchName);

    setSearchParams(nextSearchParams);
    updatePreferences({openBranchName: comparisonBranchName});
  };

  return (
    <Flex wrap="nowrap" align="center" gap="sm">
      <Select
        size="xs"
        label="Editing Branch"
        data={selectedBranchOptions}
        value={editedBranchName ?? null}
        onChange={value => {
          if (!value) return;

          setEditedBranchName(value);

          updatePreferences({openBranchName: value});

          if (value === comparisonBranchName) {
            setComparisonBranchName(null);
          }
        }}
        searchable
      />

      <ActionIcon
        variant="light"
        size="sm"
        onClick={swapBranches}
        disabled={!editedBranchName || !comparisonBranchName}
      >
        <IconArrowsLeftRight size={16}/>
      </ActionIcon>

      <Select
        size="xs"
        label="Comparison Branch"
        data={comparisonBranchOptions}
        value={comparisonSnapshotId ? OLDER_VERSION_OPTION : comparisonBranchName ?? null}
        onChange={value => {
          if (value === OLDER_VERSION_OPTION) {
            return;
          }

          setComparisonBranchName(value);
        }}
        searchable
        clearable={true}
        rightSectionPointerEvents="all"
      />
    </Flex>
  );
}

export default BranchSelector;