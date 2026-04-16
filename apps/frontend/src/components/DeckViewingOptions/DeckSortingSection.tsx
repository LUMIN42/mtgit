import {SegmentedControl} from "@mantine/core";
import type {CardSortMode} from "../../types/grouping.ts";
import {FieldSection} from "./FieldSection.tsx";

interface DeckSortingSectionProps {
  value: CardSortMode;
  onChange: (value: CardSortMode) => void;
}

export function DeckSortingSection({value, onChange}: DeckSortingSectionProps) {
  return (
    <FieldSection label="Card Sorting:">
      <SegmentedControl
        mt="xs"
        fullWidth
        size="xs"
        value={value}
        onChange={(nextValue) => onChange(nextValue as CardSortMode)}
        data={[
          {label: "Name", value: "name"},
          {label: "Price", value: "priceUsd"},
          {label: "Mana Value", value: "manaValue"},
          // {label: "Rarity", value: "rarity"},
        ]}
      />
    </FieldSection>
  );
}

