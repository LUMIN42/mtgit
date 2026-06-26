import {Box, Button, Group, Modal, Text, Textarea} from "@mantine/core";
import {useState} from "react";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {trpc} from "../../trpcClient.ts";
import {useDeckDataContext} from "../../context/DeckDataContext.tsx";

export function DeckImportModal() {
  const {repository, selectedBranchName, selectedBranchContent} = useRepositoryContext();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDeckText, setImportDeckText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const {deck} = useDeckDataContext();

  const importDeckMutation = trpc.deckImport.parse.useMutation({
    onSuccess: async () => {
      await utils.decks.get.invalidate();
    }
  });

  const closeModal = () => {
    setIsImportModalOpen(false);
    setImportError(null);
  };

  const handleConfirmImport = async (mode: "overwrite" | "merge") => {
    setIsImporting(true);
    setImportError(null);

    try {
      await importDeckMutation.mutateAsync({
        deckId: repository!._id,
        branchName: selectedBranchName ?? "main",
        mode,
        text: importDeckText
      });

      closeModal();
    }
    catch (error) {
      const message =
        error instanceof Error ? error.message : "Deck import failed.";
      setImportError(message);
    }
    finally {
      setIsImporting(false);
    }
  };

  const empty = deck.isEmpty();

  return (
    <>
      <Button
        onClick={() => setIsImportModalOpen(true)}
        variant={empty ? "gradient" : "default"}
      >
        Import deck
      </Button>

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
            onChange={event =>
              setImportDeckText(event.currentTarget.value)
            }
            style={{height: "100%"}}
            styles={{
              root: {height: "100%"},
              wrapper: {height: "calc(100% - 24px)"},
              input: {
                height: "100%",
                overflowY: "auto",
                resize: "none"
              }
            }}
          />
        </Box>

        {importError && (
          <Text c="red" size="sm" mt="sm">
            {importError}
          </Text>
        )}

        <Box
          pt="sm"
          pb="md"
          mt="md"
          style={{borderTop: "1px solid var(--mantine-color-gray-3)"}}
        >
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={closeModal}
              disabled={isImporting}
            >
              Cancel
            </Button>

            <Button
              variant="default"
              onClick={() => handleConfirmImport("merge")}
              loading={isImporting}
            >
              Add to deck
            </Button>

            <Button
              onClick={() => handleConfirmImport("overwrite")}
              loading={isImporting}
            >
              Replace deck
            </Button>
          </Group>
        </Box>
      </Modal>
    </>
  );
}