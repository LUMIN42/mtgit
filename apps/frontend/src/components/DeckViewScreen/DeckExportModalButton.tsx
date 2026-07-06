import React from "react";
import {Modal, Stack, Text, Button, Group, Radio, ScrollArea, Title, Divider, Paper} from "@mantine/core";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import {useDeckDataContext} from "../../context/DeckDataContext.tsx";
import {DECK_EXPORT_MODES, deckToExportText} from "@mtgit/shared";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {notifications} from "@mantine/notifications";


function DeckExportModalButton() {
  const {
    deckExportModalOpen,
    setDeckExportModalOpen,
    deckExportMode,
    setDeckExportMode
  } = useDeckUiContext();

  const {repository} = useRepositoryContext();
  const {deck} = useDeckDataContext();

  const exportText = deckToExportText(deck, deckExportMode, repository.name);

  return (
    <>
      {/* OPEN BUTTON */}
      <Button onClick={() => setDeckExportModalOpen(true)} variant={"default"}>
        Export Deck
      </Button>

      {/* MODAL */}
      <Modal
        opened={deckExportModalOpen}
        onClose={() => setDeckExportModalOpen(false)}
        title="Export Deck"
        centered
        styles={{
          content: {
            display: "flex",
            flexDirection: "column",
            height: "fit-content",
            width: "fit-content",
            overflow: "hidden"
          },
          body: {
            flex: 1,
            display: "flex",
            overflow: "hidden"
          }
        }}
      >
        {/* MAIN LAYOUT */}
        <Group
          wrap="nowrap"
          style={{flex: 1}}
          align="stretch"
          w="100%"
        >
          {/* LEFT SIDE */}
          <Stack style={{flex: 2, height: "100%"}}>
            <Title order={2}>Preview</Title>

            <Paper
              withBorder
              style={{
                flexGrow: 1,
                height: 0,
                display: "flex"
              }}

              w={"fit-content"}
            >
              <ScrollArea h={"100%"} pr={"lg"} pl={"sm"}>
                <Text size="xs" style={{whiteSpace: "pre-wrap", textWrap:"nowrap"}}>
                  {exportText}
                </Text>
              </ScrollArea>
            </Paper>
          </Stack>

          {/* RIGHT SIDE */}
          <Stack
            style={{flex: 1, minHeight: 0}}
            p="md"
            justify="space-between"
          >
            <Radio.Group
              value={deckExportMode}
              onChange={value =>
                setDeckExportMode(value as typeof deckExportMode)
              }
              label="Export format"
            >
              <Stack gap="xs" mt="xs">
                {DECK_EXPORT_MODES.map(mode => (
                  <Radio key={mode} value={mode} label={mode.toUpperCase()}/>
                ))}
              </Stack>
            </Radio.Group>

            <Divider/>

            <Stack>
              <Button
                variant="light"
                fullWidth
                onClick={() => {
                  const blob = new Blob([exportText], {
                    type: "text/plain;charset=utf-8"
                  });

                  const url = URL.createObjectURL(blob);

                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "deck_mtgo.txt";
                  a.click();

                  URL.revokeObjectURL(url);
                }}
              >
                Download for MTGO
              </Button>

              <Button
                fullWidth
                onClick={async () => {
                  await navigator.clipboard.writeText(exportText);

                  notifications.show({
                    title: "Copied",
                    message: "Deck exported to clipboard"
                  });
                }}
              >
                Copy to Clipboard
              </Button>
            </Stack>
          </Stack>
        </Group>
      </Modal>
    </>
  );
}

export default DeckExportModalButton;