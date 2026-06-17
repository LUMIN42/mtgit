import {Box, Button, Group, Modal, Text, Textarea} from "@mantine/core";
import {useState} from "react";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {Deck, DeckSection, emptyDeckCardCounts, mergeDecks, mergeTagsMaps} from "@mtgit/shared";
import type {CardCounts, DeckCardCounts, DeckSectionName} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";
import {trpcClient} from "../trpcClient.ts";

/**
 * Collect oracle cards from a deck for cache hydration.
 */
const collectDeckCards = (deck: Deck): ScryfallOracleCard[] => {
  const out: ScryfallOracleCard[] = [];
  for (const section of Object.values(deck.sections)) {
    for (const card of (section as DeckSection).toArray()) {
      out.push(card as ScryfallOracleCard);
    }
  }
  return out;
};

const mergeDeckCardAmounts = (base: DeckCardCounts, incoming: DeckCardCounts): DeckCardCounts => {
  const merged: Partial<Record<DeckSectionName, CardCounts>> = {...base};
  for (const [sectionName, counts] of Object.entries(incoming)) {
    const name = sectionName as DeckSectionName;
    merged[name] = merged[name] ? mergeDecks(merged[name], counts as CardCounts) : (counts as CardCounts);
  }

  return merged as DeckCardCounts;
};

/**
 * Modal UI for importing a deck list into the repository.
 */
export function DeckImportModal() {
  const {repository, selectedBranchContent, setBranchValue, selectedBranchName, setTags} = useRepositoryContext();
  const {setCards} = useScryfallCache();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDeckText, setImportDeckText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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

      // const branch = repository?.branches.find(b => b.name === selectedBranchName)
      //   ?? repository?.branches?.[0];
      const baseSections: DeckCardCounts = mode === "replace"
        ? emptyDeckCardCounts()
        : selectedBranchContent;

      const importedSections = reconstructed.toDeckCardAmounts();
      const nextSections = mode === "replace"
        ? importedSections
        : mergeDeckCardAmounts(baseSections, importedSections);

      const nextTags = mode === "replace"
        ? result.tagsMap
        : mergeTagsMaps(repository?.tags ?? {}, result.tagsMap);

      if (repository) {
        setBranchValue(selectedBranchName, nextSections);
        setTags(nextTags);
      }
      setCards(collectDeckCards(reconstructed));
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
            <Button variant="default" onClick={() => handleConfirmImport("append")} loading={isImporting}>Add to
              deck</Button>
            <Button onClick={() => handleConfirmImport("replace")} loading={isImporting}>Replace deck</Button>
          </Group>
        </Box>
      </Modal>
    </>
  );
}
