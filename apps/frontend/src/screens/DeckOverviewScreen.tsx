import React from "react";
import {
  Card,
  Stack,
  Title,
  Text,
  Loader,
  Center,
  Anchor,
} from "@mantine/core";
import { trpc } from "../trpcClient.ts";
import { useNavigate } from "react-router-dom";

function DeckOverviewScreen() {
  const navigate = useNavigate();
  const decksQuery = trpc.decks.usersDecks.useQuery();

  if (decksQuery.isLoading) {
    return (
      <Center style={{ height: "100%" }}>
        <Loader />
      </Center>
    );
  }

  if (decksQuery.isError) {
    return (
      <Center style={{ height: "100%" }}>
        <Text c="red">Failed to load decks</Text>
      </Center>
    );
  }

  const decks: { name: string; _id: string }[] = decksQuery.data ?? [];

  return (
    <Stack p="md" gap="sm">
      <Title order={2}>Your decks</Title>

      {decks.map((deck) => (
        <Card
          key={deck._id}
          shadow="sm"
          padding="md"
          radius="md"
          withBorder
          style={{ cursor: "pointer" }}
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
  );
}

export default DeckOverviewScreen;