import {useEffect, useState} from "react";
import {
  Button,
  Code,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import {IconTrash} from "@tabler/icons-react";
import {Format, formats} from "@mtgit/shared";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {trpcHooks} from "../../trpcClient.ts";
import {useNavigate} from "react-router-dom";
import {notifications} from "@mantine/notifications";

export function DeckManagementModalButton() {
  const {updateRepository, repository: deck} = useRepositoryContext();

  const [opened, setOpened] = useState(false);
  const [deleteOpened, setDeleteOpened] = useState(false);

  const [name, setName] = useState(deck.name);
  const [format, setFormat] = useState<Format>(deck.format);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const utils = trpcHooks.useUtils();
  const navigate = useNavigate();

  useEffect(() => {
    if (opened) {
      setName(deck.name);
      setFormat(deck.format);
    }
  }, [opened, deck]);

  useEffect(() => {
    if (deleteOpened) {
      setDeleteConfirmation("");
    }
  }, [deleteOpened, deck.name]);

  const deleteMutation = trpcHooks.decks.delete.useMutation({
    onSuccess: () => {
      utils.decks.usersDecks.invalidate();
      navigate("/app/decks");
    },
    onError: error => {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message
      });
    }
  });

  const handleSave = () => {
    updateRepository({
      name,
      format
    });

    setOpened(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpened(true)}
        loading={deleteMutation.isPending}
        variant="default"
      >
        Manage Deck
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Manage Deck"
      >
        <Stack>
          <TextInput
            label="Deck name"
            value={name}
            onChange={e => setName(e.currentTarget.value)}
          />

          <Select
            label="Format"
            placeholder="Choose format"
            value={format}
            onChange={formatString => setFormat(formatString as Format)}
            data={formats.map(format => ({
              value: format,
              label: format
            }))}
          />

          <Group justify={"space-between"}>
            <Button
              color="red"
              variant="subtle"
              leftSection={<IconTrash size={16}/>}
              w={"fit-content"}
              p={"xs"}
              onClick={() => {
                setOpened(false);
                setDeleteConfirmation("");
                setDeleteOpened(true);
              }}
            >
              Delete Deck
            </Button>

            <Group>
              <Button
                variant="default"
                onClick={() => setOpened(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                disabled={!name || !format}
              >
                Save
              </Button>
            </Group>
          </Group>

        </Stack>
      </Modal>

      <Modal
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        title="Delete Deck"
      >
        <Stack>
          <Text c="red" fw={500}>
            This action cannot be undone.
          </Text>

          <Text>
            To confirm deletion, type the deck name exactly as shown below.
          </Text>

          <Code>{deck.name}</Code>

          <TextInput
            label="Deck name"
            placeholder={deck.name}
            value={deleteConfirmation}
            onChange={e => setDeleteConfirmation(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDeleteOpened(false)}
            >
              Cancel
            </Button>

            <Button
              color="red"
              variant={"filled"}
              leftSection={<IconTrash size={16}/>}
              loading={deleteMutation.isPending}
              disabled={deleteConfirmation !== deck.name}
              onClick={() =>
                deleteMutation.mutate({deckId: deck._id})
              }
            >
              Delete Deck
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}