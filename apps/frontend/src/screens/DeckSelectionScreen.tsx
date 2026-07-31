import React, {useState} from "react";
import {
  Stack,
  Title,
  Text,
  Center,
  Group,
  Button,
  Modal,
  TextInput,
  Select, Paper, Anchor, Loader
} from "@mantine/core";
import {trpcHooks} from "../trpcClient.ts";
import {Link, useNavigate} from "react-router-dom";
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

  const sampleDeckMutation = trpcHooks.deckImport.sampleRepository.useMutation({
    onSuccess: data => {
      navigate(`../deck/${data}`);
    }
  });

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

    const repoId = await createDeck.mutateAsync({
      deckName: name,
      format
    });

    setName("");
    setFormat(null);
    setOpened(false);

    navigate(`../deck/${repoId}`);
  };

  return (
    <>
      <Stack p="md" gap="sm">
        <Title order={2}>Your decks</Title>


        <Group>
          <Button onClick={() => setOpened(true)} w={"fit-content"}>
            Create New Deck
          </Button>
          <Button variant={"default"} onClick={() => sampleDeckMutation.mutate()} loading={sampleDeckMutation.isPending}>
            Create Sample Deck
          </Button>
        </Group>

        {/*<div style={{*/}
        {/*  display: "grid",*/}
        {/*  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",*/}
        {/*  gap: "1rem"*/}
        {/*}}>*/}
        {/*  {Array.from({length: 10}, (_, index) => (*/}
        {/*    <Skeleton h={"3.5em"}/>*/}
        {/*  ))}*/}
        {/*</div>*/}

        {
          decksQuery.isLoading &&
          (<Center>
            <Loader/>
          </Center>)
        }

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem"
        }}>
          {decks.map(deck => (
            <Anchor
              component={Link}
              to={`/app/deck/${deck._id}`}
              underline="never"
              key={deck._id}
            >
              <Paper
                withBorder
                p="md"
                ta="center"
                shadow="sm"
                className={classes.hoverRiseShadow}
              >
                {deck.name}
              </Paper>
            </Anchor>
          ))}
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