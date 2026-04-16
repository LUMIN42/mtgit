import {GroupedCards} from "../components/GroupedCards.tsx";
import {DeckViewingOptions} from "../components/DeckViewingOptions.tsx";
import {Grid, Group, Stack} from "@mantine/core";

import style from "../assets/index.module.css";
import {DeckImportModal} from "../components/DeckImportModal.tsx";


export function DeckViewScreen() {
  return <Stack>
    <Group>
      <DeckImportModal/>
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