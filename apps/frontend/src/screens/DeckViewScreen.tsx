import {CardGrid} from "../components/CardGrid.tsx";
import {DeckViewingOptions} from "../components/DeckViewingOptions.tsx";
import {Grid} from "@mantine/core";

import style from "../assets/index.module.css";


export function DeckViewScreen() {
  return <Grid className={style.stretchChildren}>
    <Grid.Col className={`${style.stretchMe} ${style.relative}`} span={3}>
      <DeckViewingOptions/>
    </Grid.Col>

    <Grid.Col span={8}>
      <CardGrid/>
    </Grid.Col>
  </Grid>;
}