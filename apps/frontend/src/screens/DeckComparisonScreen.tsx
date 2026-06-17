import React from "react";
import {Stack} from "@mantine/core";
import {DeckViewingOptions} from "../components/DeckViewingOptions.tsx";
import {GroupedCards} from "../components/GroupedCards.tsx";

function DeckComparisonScreen() {
  return (
    <Stack>
      <DeckViewingOptions horizontal={true}/>
      <GroupedCards/>
    </Stack>
  );
}

export default DeckComparisonScreen;