import {Box, Button, Group, Modal, Text, Textarea} from "@mantine/core";
import {useState} from "react";
import {useDeckContext} from "../context/DeckUiContext.tsx";
import {useTagsContext} from "../context/useTagsContext.ts";
import {Deck, type TagsMap} from "@mtgit/shared";
import {trpcClient} from "../trpcClient.ts";

export function DeckImportModal() {
  const {setDeck} = useDeckContext();
  const {setTags} = useTagsContext();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDeckText, setImportDeckText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // používáme `Deck.merge` metodu z shared balíčku

  const mergeTagsMaps = (currentTags: TagsMap, importedTags: TagsMap): TagsMap => {
    const merged: TagsMap = {...currentTags};

    for (const [cardId, tags] of Object.entries(importedTags)) {
      const existingTags = merged[cardId] ?? [];
      merged[cardId] = Array.from(new Set([...existingTags, ...tags]));
    }

    return merged;
  };

  const closeModal = () => {
    setIsImportModalOpen(false);
    setImportError(null);
  };

  const handleConfirmImport = async (mode: "replace" | "append") => {
    setIsImporting(true);
    setImportError(null);

    try {
      const result = await trpcClient.deckImport.parse.mutate({text: importDeckText});
      const reconstructed = Deck.reconstruct(result.deck);
      
      if (mode === "replace") {
        setDeck(reconstructed);
        setTags(result.tagsMap);
      }
      else {
        setDeck(currentDeck => Deck.merge(currentDeck, reconstructed));
        setTags(currentTags => mergeTagsMaps(currentTags, result.tagsMap));
      }
      closeModal();
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Deck import failed.";
      setImportError(message);
    }
    finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsImportModalOpen(true)}>Import deck</Button>

      <Modal
        opened={isImportModalOpen}
        onClose={closeModal}
        title="Import deck"
        fullScreen
        lockScroll
        styles={{
          body: {
            height: "calc(100vh - 70px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }
        }}
      >
        <Box style={{flex: 1, minHeight: 0}}>
          <Textarea
            label="Paste deck list"
            placeholder="1 Sol Ring\n1 Arcane Signet\n1 Command Tower"
            value={importDeckText}
            onChange={event => setImportDeckText(event.currentTarget.value)}
            style={{height: "100%"}}
            styles={{
              root: {height: "100%"},
              wrapper: {height: "calc(100% - 24px)"},
              input: {height: "100%", overflowY: "auto", resize: "none"}
            }}
          />
        </Box>

        {importError ? <Text c="red" size="sm" mt="sm">{importError}</Text> : null}

        <Box pt="sm" pb="md" mt="md" style={{borderTop: "1px solid var(--mantine-color-gray-3)"}}>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal} disabled={isImporting}>Cancel</Button>
            <Button variant="default" onClick={() => handleConfirmImport("append")} loading={isImporting}>Add to deck</Button>
            <Button onClick={() => handleConfirmImport("replace")} loading={isImporting}>Replace deck</Button>
          </Group>
        </Box>
      </Modal>
    </>
  );
}
