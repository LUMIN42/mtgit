import {useEffect, useMemo, useState, useTransition} from "react";
import {Flex, Select, ActionIcon} from "@mantine/core";
import {IconArrowsLeftRight} from "@tabler/icons-react";

import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {
  COMPARISON_BRANCH_NAME_URL_KEY,
  EDITED_BRANCH_NAME_URL_KEY,
  useDeckUrlManager
} from "../../../hooks/DeckUrlManager.tsx";
import {useSearchParams} from "react-router-dom";

const OLDER_VERSION_OPTION = "Older Version";

function BranchSelector() {
  const {repository} = useRepositoryContext();

  const {
    editedBranchName,
    comparisonBranchName,
    comparisonSnapshotId,
    setEditedBranchName,
    setComparisonBranchName
  } = useDeckUrlManager();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const [localEditedBranchName, setLocalEditedBranchName] = useState<string | null>(editedBranchName ?? null);
  const [localComparisonBranchName, setLocalComparisonBranchName] = useState<string | null>(comparisonBranchName ?? null);

  const branches = Object.keys(repository.branches ?? {});

  useEffect(
    () => {
      setLocalEditedBranchName(editedBranchName ?? null);
    },
    [editedBranchName]
  );

  useEffect(
    () => {
      setLocalComparisonBranchName(comparisonBranchName ?? null);
    },
    [comparisonBranchName]
  );

  const comparisonBranchOptions = useMemo(
    () => {
      const options = branches.filter(branchName => branchName !== localEditedBranchName);

      if (comparisonSnapshotId) {
        options.unshift(OLDER_VERSION_OPTION);
      }

      return options;
    },
    [branches, localEditedBranchName, comparisonSnapshotId]
  );

  const selectedBranchOptions = useMemo(
    () => branches.filter(branchName => branchName !== localComparisonBranchName),
    [branches, localComparisonBranchName]
  );

  const swapBranches = () => {
    if (!localEditedBranchName || !localComparisonBranchName) return;

    setLocalEditedBranchName(localComparisonBranchName);
    setLocalComparisonBranchName(localEditedBranchName);

    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set(EDITED_BRANCH_NAME_URL_KEY, localComparisonBranchName);
    nextSearchParams.set(COMPARISON_BRANCH_NAME_URL_KEY, localEditedBranchName);

    startTransition(() => {
      setSearchParams(nextSearchParams);
    });
  };

  return (
    <Flex wrap="nowrap" align="center" gap="sm">
      <Select
        size="xs"
        label="Editing Branch"
        data={selectedBranchOptions}
        value={localEditedBranchName}
        onChange={value => {
          if (!value) return;

          setLocalEditedBranchName(value);

          if (value === localComparisonBranchName) {
            setLocalComparisonBranchName(null);
          }

          startTransition(() => {
            setEditedBranchName(value);

            if (value === localComparisonBranchName) {
              setComparisonBranchName(null);
            }
          });
        }}
        searchable
      />

      <ActionIcon
        variant="light"
        size="sm"
        onClick={swapBranches}
        disabled={!localEditedBranchName || !localComparisonBranchName}
      >
        <IconArrowsLeftRight size={16}/>
      </ActionIcon>

      <Select
        size="xs"
        label="Comparison Branch"
        data={comparisonBranchOptions}
        value={comparisonSnapshotId && !localComparisonBranchName ? OLDER_VERSION_OPTION : localComparisonBranchName}
        onChange={value => {
          if (value === OLDER_VERSION_OPTION) {
            return;
          }

          setLocalComparisonBranchName(value ?? null);

          startTransition(() => {
            setComparisonBranchName(value);
          });
        }}
        searchable
        clearable={true}
        rightSectionPointerEvents="all"
      />
    </Flex>
  );
}

export default BranchSelector;