import React, {useState} from "react";
import {
  Stack,
  Title,
  Text,
  Loader,
  Center,
  Group,
  Button,
  Modal,
  TextInput,
  Select, Paper
} from "@mantine/core";
import {trpcHooks} from "../trpcClient.ts";
import {useNavigate} from "react-router-dom";
import {Format, formats} from "@mtgit/shared";

import classes from "@styles/index.module.css";

function DeckSelectionScreen() {
  const navigate = useNavigate();

  const utils = trpcHooks.useUtils();

  const decksQuery = trpcHooks.decks.usersDecks.useQuery();
  const createDeck = trpcHooks.decks.create.useMutation({
    onSuccess: () => utils.decks.usersDecks.invalidate()
  });

  const [opened, setOpened] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<Format | null>(null);

  if (decksQuery.isLoading) {
    return (
      <Center style={{height: "100%"}}>
        <Loader/>
      </Center>
    );
  }

  if (decksQuery.isError) {
    return (
      <Center style={{height: "100%"}}>
        <Text c="red">Failed to load decks</Text>
      </Center>
    );
  }

  const decks: {name: string, _id: string}[] = decksQuery.data ?? [];

  const handleCreate = async () => {
    if (!name || !format) {
      return;
    }

    await createDeck.mutateAsync({
      deckName: name,
      format
    });

    setName("");
    setFormat(null);
    setOpened(false);
  };

  return (
    <>
      <Stack p="md" gap="sm">
        <Title order={2}>Your decks</Title>

        <Button onClick={() => setOpened(true)} w={"fit-content"}>
          Create New Deck
        </Button>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem"
        }}>
          {
            decks.map(deck => <Paper
              onClick={() => navigate(`/app/deck/${deck._id}`)}
              withBorder
              p={"md"}
              ta={"center"}
              shadow="sm"
              key={deck._id}
              className={classes.hoverRiseShadow}
            >
              {deck.name}
            </Paper>)
          }
        </div>
      </Stack>

      {/* CREATE DECK MODAL */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Create new deck"
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
            onChange={format => setFormat(format)}
            data={formats.map(format => ({
              value: format,
              label: format
            }))}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>

            <Button
              onClick={handleCreate}
              disabled={!name || !format || createDeck.isPending}
              loading={createDeck.isPending}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export default DeckSelectionScreen;