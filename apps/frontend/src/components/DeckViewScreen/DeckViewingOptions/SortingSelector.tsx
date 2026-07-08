import {SegmentedControl} from "@mantine/core";
import {FieldSection} from "./FieldSection.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";

export function SortingSelector() {
  const {sortingMode, setSortingMode} = useDeckUiContext();

  return (
    <FieldSection label="Card Sorting:">
      <SegmentedControl
        mt="xs"
        fullWidth
        size="xs"
        value={sortingMode}
        onChange={nextValue => setSortingMode(nextValue)}
        data={[
          {label: "Name", value: "name"},
          {label: "Price", value: "priceUsd"},
          {label: "Mana Value", value: "manaValue"}
          // {label: "Rarity", value: "rarity"},
        ]}
      />
    </FieldSection>
  );
}

