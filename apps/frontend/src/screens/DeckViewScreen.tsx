import {GroupedCards} from "../components/GroupedCards.tsx";
import {DeckViewingOptions} from "../components/DeckViewingOptions.tsx";
import {Grid, Group, Stack} from "@mantine/core";

import style from "../assets/index.module.css";
import {DeckImportModal} from "../components/DeckImportModal.tsx";
import {DeckDisplayModeSection} from "../components/DeckViewingOptions/DeckDisplayModeSection.tsx";
import {useDeckContext} from "../context/DeckUiContext.tsx";


export function DeckViewScreen() {
  const deck = useDeckContext();

  const toggleDisplayMode = () => {
    deck.setDisplayMode((currentMode) => (currentMode === "Images" ? "Text" : "Images"));
  };

  return <Stack>
    <Group>
      <DeckImportModal/>
      <DeckDisplayModeSection value={deck.displayMode} onToggle={toggleDisplayMode}/>

    </Group>
    <Grid className={style.stretchChildren}>


      <Grid.Col className={`${style.stretchMe} ${style.relative}`} span={3}>
        <DeckViewingOptions/>
      </Grid.Col>

      <Grid.Col span={8}>
        <GroupedCards/>
      </Grid.Col>
    </Grid>
  </Stack>
    ;
}