import {SegmentedControl} from "@mantine/core";
import type {CardGroupingMode} from "../../types/grouping.ts";
import {FieldSection} from "./FieldSection.tsx";

interface DeckGroupingSectionProps {
  value: CardGroupingMode;
  onChange: (value: CardGroupingMode) => void;
}

export function DeckGroupingSection({value, onChange}: DeckGroupingSectionProps) {
  return (
    <FieldSection label="Card Grouping:">
      <SegmentedControl
        mt="xs"
        fullWidth
        size="xs"
        value={value}
        onChange={(nextValue) => onChange(nextValue as CardGroupingMode)}
        data={[
          {label: "None", value: "none"},
          {label: "Type", value: "type"},
          {label: "Mana Value", value: "manaValue"},
          {label: "Tags", value: "tags"},
        ]}
      />
    </FieldSection>
  );
}

