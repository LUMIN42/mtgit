import {SegmentedControl} from "@mantine/core";
import type {CardGroupingMode} from "../../../types/grouping.ts";
import {FieldSection} from "./FieldSection.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";



export function DeckGroupingSection() {
  const {groupingMode, setGroupingMode} = useDeckUiContext();

  return (
    <FieldSection label="Card Grouping:">
      <SegmentedControl
        mt="xs"
        fullWidth
        size="xs"
        value={groupingMode}
        onChange={nextValue => setGroupingMode(nextValue as CardGroupingMode)}
        data={[
          {label: "None", value: "none"},
          {label: "Type", value: "type"},
          {label: "Mana Value", value: "manaValue"},
          {label: "Tags", value: "tags"}
        ]}
      />
    </FieldSection>
  );
}

