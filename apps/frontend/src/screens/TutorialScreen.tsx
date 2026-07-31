import React from "react";
import {Stack, Title, Text, Anchor, Paper} from "@mantine/core";

export function TutorialScreen() {
  return (
    <Stack maw={1000} mx={"auto"}>
      <Title order={1}>Quickstart Guide</Title>
      <Title order={2}>
        Introduction
      </Title>
      <Text>
        Unlike most other MTG deck editors, MTGit deals not in decks, but in&nbsp;
        <Text component={"b"}>deck repositories</Text>.
        Each deck repository consists of multiple <Text component={"b"}>branches</Text>.
        Each branch contains a single version of your deck.
      </Text>
      <Title order={2}>
        Branch Use Cases
      </Title>
      <Text>
        There are many ways to divide your deck repository into branches.

        You may have a separate branch containing cards you are considering for use.
        An experimental branch next to a stable branch in case the experiments go wrong and you want to roll them
        back.
        A separate branch for the deck you are aspiring towards versus the branch with the cheaper replacement cards
        you
        already own.
        Separate branches for each commander bracket.

        The possibilities are limitless. I am sure you can come up with many of your own.
      </Text>
      <Title order={2}>
        Card Searching
      </Title>
      <Text>
        MTGit utilizes <Anchor href={"https://scryfall.com/docs/syntax"}>scryfall query syntax</Anchor> for card
        searching.

        There is also plenty of&nbsp;
        <Anchor href={"https://youtu.be/U7TdliHHR7g?t=60"}>video tutorials</Anchor> that can help you get started.

        After searching for the first time in the MTGit app, it is also recommended to edit the search query defaults
        on the search result screen.

        <Text>
          Starter commander query defaults would be something like:
        </Text>

        <Paper withBorder p={"xs"}>
          format:commander id&lt;=(your commander's color identity) order:edhrec
        </Paper>
      </Text>
    </Stack>
  );
}