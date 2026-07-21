import {GroupedCards} from "../../components/GroupedCards.tsx";
import {DeckViewingOptions} from "../../components/DeckViewScreen/DeckViewingOptions/DeckViewingOptions.tsx";
import {ActionIcon, Box, Button, Flex, Group, Stack, TextInput, Title, Tooltip} from "@mantine/core";

import style from "@styles/index.module.css";
import {DeckImportModalButton} from "../../components/DeckViewScreen/DeckImportModalButton.tsx";
import {DeckDisplayModeSection} from "../../components/DeckViewScreen/DeckViewingOptions/DeckDisplayModeSection.tsx";

import {
  useDeckUiContext
} from "../../context/DeckUiContext.tsx";

import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import DeckExportModalButton from "../../components/DeckViewScreen/DeckExportModalButton.tsx";
import BranchManagementModalButton from "../../components/DeckViewScreen/BranchManagementModalButton.tsx";
import {Link} from "react-router-dom";
import {IconCheck, IconPencil} from "@tabler/icons-react";
import {useState} from "react";
import {QuickEditSwitch} from "../../components/DeckViewScreen/QuickEditSwitch.tsx";
import {useMediaQuery} from "@mantine/hooks";

export function DeckViewScreen() {
  const ui = useDeckUiContext();
  const repo = useRepositoryContext();

  const [renamingDeck, setRenamingDeck] = useState<boolean>(false);
  const [deckRenamingTextbox, setDeckRenamingTextbox] = useState("");


  const toggleDisplayMode = () => {
    ui.setDisplayMode(m => (m === "Images" ? "Text" : "Images"));
  };

  const verticalized = useMediaQuery("(max-width: 900px)");


  return (
    <Stack style={{maxWidth: "1400px", margin: "auto"}}>
      <Group>
        {
          renamingDeck
            ?
            <TextInput
              // h={"2em"}
              value={deckRenamingTextbox}
              onChange={e => setDeckRenamingTextbox(e.currentTarget.value)}

              size={"xl"}

              styles={{
                input: {
                  fontSize: "var(--mantine-h1-font-size)",
                  fontWeight: "var(--mantine-h1-font-weight)",
                  lineHeight: "var(--mantine-h1-line-height)"
                }
              }}
            />
            :
            <Title order={1}>
              {repo.repository?.name}
            </Title>
        }

        <Tooltip label={"Rename Deck"}>
          {renamingDeck ? (
            <ActionIcon
              variant="outline"
              onClick={() => {
                repo.updateRepository({name: deckRenamingTextbox});
                setRenamingDeck(false);
              }}
            >
              <IconCheck/>
            </ActionIcon>
          ) : (
            <ActionIcon
              color="var(--mantine-color-dimmed)"
              variant="subtle"
              onClick={() => {
                setDeckRenamingTextbox(repo.repository.name);
                setRenamingDeck(true);
              }}
            >
              <IconPencil/>
            </ActionIcon>
          )}
        </Tooltip>
      </Group>

      <Group>
        <DeckImportModalButton/>
        <DeckExportModalButton/>

        <DeckDisplayModeSection
          value={ui.displayMode}
          onToggle={toggleDisplayMode}
        />

        <BranchManagementModalButton/>

        <Button variant={"default"} component={Link} to={"history"}>
          Branch History
        </Button>

        <QuickEditSwitch/>
      </Group>

      {/*<CreateBranchModal*/}
      {/*  opened={isCreateBranchOpen}*/}
      {/*  onClose={() => setIsCreateBranchOpen(false)}*/}
      {/*/>*/}

      <Flex
        gap="xl"
        direction={verticalized ? "column" : "row"}
        align="stretch"
        className={style.stretchChildren}
      >
        <Box
          w={verticalized ? "100%" : "20rem"}
          className={`${style.stretchMe} ${style.relative}`}
          style={{flexShrink: 0}}
        >
          <DeckViewingOptions narrowViewport={verticalized}/>
        </Box>

        <Box style={{flex: 1, minWidth: 0}}>
          <GroupedCards/>
        </Box>
      </Flex>
    </Stack>
  );
}