import {ActionIcon, Button, Group, Modal, Radio, Stack, TextInput, UnstyledButton} from "@mantine/core";
import {useState} from "react";
import {DeckCardCounts, emptyDeckCardCounts} from "@mtgit/shared";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {IconPlus} from "@tabler/icons-react";

export function CreateBranchModal() {
  const repo = useRepositoryContext();
  const [newBranchName, setNewBranchName] = useState("");
  const [baseBranchName, setBaseBranchName] = useState("Empty");

  const branchOptions = [...Object.keys(repo.repository.branches), "Empty"];

  const [isOpened, setIsOpened] = useState<boolean>(false);

  const handleCreateBranch = () => {
    const trimmedName = newBranchName.trim();
    if (!trimmedName || !repo.repository) {
      return;
    }

    const cardCounts: DeckCardCounts = repo.repository.branches[baseBranchName] ?? emptyDeckCardCounts();

    repo.createBranch(trimmedName, cardCounts);

    setNewBranchName("");
    setBaseBranchName("Empty");
  };

  return (
    <>
      <ActionIcon variant={"subtle"} w={"100%"} onClick={() => setIsOpened(true)}>
        <IconPlus/>
      </ActionIcon>
      <Modal
        opened={isOpened}
        onClose={() => setIsOpened(false)}
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
                  style={{
                    width: "100%",
                    borderRadius: 4,
                    padding: "4px 6px",
                    transition: "background-color 120ms ease"
                  }}
                  styles={{root: {":hover": {backgroundColor: "var(--mantine-color-gray-1)"}}}}
                >
                  <Radio value={option} label={option}/>
                </UnstyledButton>
              ))}
            </Stack>
          </Radio.Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsOpened(false)}>Cancel</Button>
            <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

