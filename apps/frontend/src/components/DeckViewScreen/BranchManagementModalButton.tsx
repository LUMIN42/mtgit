import React, {useState} from "react";
import {ActionIcon, Button, Grid, Group, Modal, Stack, Text, TextInput} from "@mantine/core";
import {IconCheck, IconEye, IconEyeClosed, IconPencil, IconTrash, IconX} from "@tabler/icons-react";

import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import {CreateBranchModal} from "./CreateBranchModal.tsx";
import {trpcHooks} from "../../trpcClient.ts";

function VisibilityEye({branchName}: {branchName: string}) {
  const utils = trpcHooks.useUtils();
  const {repository} = useRepositoryContext();

  const visibilityQuery = trpcHooks.repositoryPreferences.getBranchVisibility.useQuery({
    repositoryId: repository._id,
    branchName
  });


  const preferencesMutation =
    trpcHooks.repositoryPreferences.setBranchVisibility.useMutation({
      onMutate: async ({repositoryId, branchName, hidden}) => {
        await utils.repositoryPreferences.getBranchVisibility.cancel({
          repositoryId,
          branchName
        });

        const previous =
          utils.repositoryPreferences.getBranchVisibility.getData({
            repositoryId,
            branchName
          });

        utils.repositoryPreferences.getBranchVisibility.setData(
          {repositoryId, branchName},
          {
            hidden
          }
        );

        return {previous};
      },

      onError: (_, variables, context) => {
        utils.repositoryPreferences.getBranchVisibility.setData(
          {
            repositoryId: variables.repositoryId,
            branchName: variables.branchName
          },
          context?.previous
        );
      },

      onSettled: (_, __, variables) => {
        utils.repositoryPreferences.getBranchVisibility.invalidate(variables);
      }
    });

  const isHidden = visibilityQuery.data?.hidden;

  const loading = preferencesMutation.isPending || visibilityQuery.isPending || isHidden === undefined;

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
      loading={loading}
      onClick={() => {
        preferencesMutation.mutate({
          repositoryId: repository._id,
          branchName,
          hidden: !isHidden
        });
      }}
    >
      {isHidden ? <IconEyeClosed/> : <IconEye/>}
    </ActionIcon>
  );
}

function BranchManagementModalButton() {
  const [modalIsOpen, setModalIsOpen] = useState(false);
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
      <Button
        variant="default"
        onClick={() => setModalIsOpen(true)}
      >
        Manage Branches
      </Button>

      <Modal
        opened={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        title={<Text fw={700} size="lg">
          Branches:
        </Text>}
      >
        <Stack gap={"md"}>
          <Grid align="center">
            {branches.map(branchName => {
              const renameValue = branchRenames[branchName];

              return (
                <React.Fragment key={branchName}>
                  <Grid.Col span={8}>
                    {renameValue !== undefined ? (
                      <TextInput
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
                      <Text>
                        {branchName}
                      </Text>
                    )}
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Group justify="flex-end" gap="xs">
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
                                  setSelectedBranchName(newName); // todo make sure this doesn't lead to void if request rollbacks
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
                  </Grid.Col>
                </React.Fragment>
              );
            })}
          </Grid>
          <CreateBranchModal/>
        </Stack>
      </Modal>

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

export default BranchManagementModalButton;