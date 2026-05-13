import {Button, Group, Modal, Radio, Stack, TextInput, UnstyledButton} from "@mantine/core";
import {useMemo, useState} from "react";
import type {DeckCardAmounts} from "@mtgit/shared";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";

type CreateBranchModalProps = {
  opened: boolean;
  onClose: () => void;
};

export function CreateBranchModal({opened, onClose}: CreateBranchModalProps) {
  const repo = useRepositoryContext();
  const [newBranchName, setNewBranchName] = useState("");
  const [baseBranchName, setBaseBranchName] = useState("Empty");

  const branchOptions = useMemo(
    () => ["Empty", ...repo.repository.branches.map(branch => branch.name)],
    [repo.repository.branches]
  );

  const handleCreateBranch = () => {
    const trimmedName = newBranchName.trim();
    if (!trimmedName || !repo.repository) {
      return;
    }

    const existing = new Set(repo.repository.branches.map(branch => branch.name));
    if (existing.has(trimmedName)) {
      return;
    }

    let sections: DeckCardAmounts = {};
    if (baseBranchName && baseBranchName !== "Empty") {
      const source = repo.repository.branches.find(branch => branch.name === baseBranchName);
      const latest = source?.versions[source.versions.length - 1];
      if (latest) {
        sections = latest.sections;
      }
    }

    const newVersion = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sections
    };

    const nextRepository = {
      ...repo.repository,
      branches: [
        ...repo.repository.branches,
        {
          name: trimmedName,
          rootVersion: newVersion.id,
          versions: [newVersion]
        }
      ]
    };

    repo.setRepository(nextRepository);
    repo.setSelectedBranchName(trimmedName);
    setNewBranchName("");
    setBaseBranchName("Empty");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create branch"
    >
      <Stack gap="sm">
        <TextInput
          label="Branch name"
          value={newBranchName}
          onChange={event => setNewBranchName(event.currentTarget.value)}
        />
        <Radio.Group
          label="Base branch"
          value={baseBranchName}
          onChange={value => setBaseBranchName(value)}
        >
          <Stack gap="xs">
            {branchOptions.map(option => (
              <UnstyledButton
                key={option}
                onClick={() => setBaseBranchName(option)}
                style={{width: "100%", borderRadius: 4, padding: "4px 6px", transition: "background-color 120ms ease"}}
                styles={{root: {":hover": {backgroundColor: "var(--mantine-color-gray-1)"}}}}
              >
                <Radio value={option} label={option}/>
              </UnstyledButton>
            ))}
          </Stack>
        </Radio.Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>Create</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

