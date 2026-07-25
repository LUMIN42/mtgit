import React, {useState} from "react";
import {ActionIcon, Button, Group, Modal, Stack, Text, TextInput, Title} from "@mantine/core";
import {IconCheck, IconEye, IconEyeClosed, IconPencil, IconTrash, IconX} from "@tabler/icons-react";

import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import {CreateBranchModal} from "./CreateBranchModal.tsx";
import {useRepositoryPreferences} from "../../context/RepositoryPreferencesContext.tsx";

function VisibilityEye({branchName}: {branchName: string}) {
  const {preferences, updatePreferences} = useRepositoryPreferences();

  const isHidden = preferences.hiddenBranches.includes(branchName);

  return (
    <ActionIcon
      color="gray"
      variant="light"
      title={
        isHidden
          ? "Branch is Hidden ~ cannot be edited through card detail menu."
          : "Branch is Revealed ~ can be edited through card detail menu."
      }
      style={{cursor: "pointer"}}
      onClick={() => {
        updatePreferences({
          hiddenBranches: isHidden ? preferences.hiddenBranches.filter(hiddenBranch => hiddenBranch !== branchName)
            : [...preferences.hiddenBranches, branchName]
        });
      }}
    >
      {isHidden ? <IconEyeClosed/> : <IconEye/>}
    </ActionIcon>
  );
}

function BranchManagement() {
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

  const {repository} = useRepositoryContext();


  const branches = Object.keys(repository.branches);

  const [branchRenames, setBranchRenames] = useState<Record<string, string>>({});

  const {setRepositoryValue} = useRepositoryContext();

  const {selectedBranchName, setSelectedBranchName} = useDeckUiContext();

  const handleDeleteBranch = (branchName: string) => {
    const repoCopy = structuredClone(repository);
    delete repoCopy.branches[branchName];
    setRepositoryValue(repoCopy);

    if (branchName === selectedBranchName) {
      const remainingBranches = branches.filter(b => b !== branchName);
      if (remainingBranches.length > 0) {
        setSelectedBranchName(remainingBranches[0]);
      }
    }

    setBranchToDelete(null);
  };

  return (
    <>
      <Stack gap={"md"}>
        <Title order={4}>
          Branches
        </Title>
        {branches.map(branchName => {
          const renameValue = branchRenames[branchName];

          return (
            <Group key={branchName} justify="space-between" align="center">
              <div style={{flex: 1}}>
                {renameValue !== undefined ? (
                  <TextInput
                    style={{
                      flexGrow: 1
                    }}
                    value={renameValue}
                    onChange={({currentTarget}) => {
                      const value = currentTarget.value;

                      setBranchRenames(prev => ({
                        ...prev,
                        [branchName]: value
                      }));
                    }}
                  />
                ) : (
                  <Text
                    style={{
                      flexGrow: 1
                    }}
                  >
                    {branchName}
                  </Text>
                )}
              </div>

              {/*Buttons*/}
              <Group gap="xs" wrap="nowrap" w={"fit-content"}>
                {renameValue !== undefined ? (
                  <>
                    <ActionIcon
                      color="green"
                      variant="light"
                      title="Confirm rename"
                      onClick={
                        () => {
                          const repoCopy = structuredClone(repository);
                          const newName = branchRenames[branchName];

                          delete repoCopy.branches[branchName];
                          repoCopy.branches[newName] = repository.branches[branchName];

                          setRepositoryValue(repoCopy);

                          if (branchName === selectedBranchName) {
                            setSelectedBranchName(newName);
                          }

                          setBranchRenames(renames => {
                            const {[branchName]: _, ...rest} = renames;

                            return rest;
                          });
                        }}
                    >
                      <IconCheck size={16}/>
                    </ActionIcon>

                    <ActionIcon
                      color="gray"
                      variant="light"
                      title="Cancel rename"
                      onClick={() =>
                        setBranchRenames(prev => {
                          const next = {...prev};
                          delete next[branchName];
                          return next;
                        })
                      }
                    >
                      <IconX size={16}/>
                    </ActionIcon>
                  </>
                ) : (
                  <ActionIcon
                    variant="light"
                    title="Rename branch"
                    onClick={() =>
                      setBranchRenames(prev => ({
                        ...prev,
                        [branchName]: branchName
                      }))
                    }
                  >
                    <IconPencil size={16}/>
                  </ActionIcon>
                )}

                <VisibilityEye branchName={branchName}/>

                <ActionIcon
                  color="red"
                  variant="light"
                  title="Delete branch"
                  onClick={() => setBranchToDelete(branchName)}
                >
                  <IconTrash size={16}/>
                </ActionIcon>
              </Group>
            </Group>
          );
        })}
        <CreateBranchModal/>
      </Stack>

      <Modal
        opened={branchToDelete !== null}
        onClose={() => setBranchToDelete(null)}
        title="Delete branch"
        centered
      >
        <Text mb="md">
          Are you sure you want to delete "<strong>{branchToDelete}</strong>"?
        </Text>
        <Group justify="flex-end">
          <Button variant="gradient" onClick={() => setBranchToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            variant={"filled"}
            onClick={() => branchToDelete && handleDeleteBranch(branchToDelete)}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}

export default BranchManagement;