import React, {useState} from "react";
import {
  Card,
  Stack,
  Title,
  Text,
  Loader,
  Center,
  Anchor,
  Group,
  Button,
  Modal,
  TextInput,
  Select
} from "@mantine/core";
import {trpc} from "../trpcClient.ts";
import {useNavigate} from "react-router-dom";
import {Format, formats} from "@mtgit/shared";

function DeckOverviewScreen() {
  const navigate = useNavigate();

  const utils = trpc.useUtils();

  const decksQuery = trpc.decks.usersDecks.useQuery();
  const createDeck = trpc.decks.create.useMutation({
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
        <Group>
          <Title order={2}>Your decks</Title>

          <Button onClick={() => setOpened(true)}>
            New Deck
          </Button>
        </Group>

        {decks.map(deck => (
          <Card
            key={deck._id}
            shadow="sm"
            padding="md"
            radius="md"
            withBorder
            style={{cursor: "pointer"}}
            onClick={() => navigate(`/app/deck/${deck._id}`)}
          >
            <Anchor
              component="button"
              onClick={() => navigate(`/app/deck/${deck._id}`)}
            >
              {deck.name}
            </Anchor>

            <Text size="xs" c="dimmed">
              Click to open
            </Text>
          </Card>
        ))}
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

export default DeckOverviewScreen;