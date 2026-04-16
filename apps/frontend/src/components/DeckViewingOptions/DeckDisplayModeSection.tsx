import {Box, SegmentedControl} from "@mantine/core";
import type {CardDisplayMode} from "../../context/DeckContext.tsx";
import {FieldSection} from "./FieldSection.tsx";

interface DeckDisplayModeSectionProps {
  value: CardDisplayMode;
  onToggle: () => void;
}

export function DeckDisplayModeSection({value, onToggle}: DeckDisplayModeSectionProps) {
  return (
    <FieldSection label="Card Display Mode:">
      <Box onMouseDownCapture={onToggle}>
        <SegmentedControl
          fullWidth
          size="xs"
          value={value}
          data={[
            {label: "Images", value: "Images"},
            {label: "Text", value: "Text"},
          ]}
        />
      </Box>
    </FieldSection>
  );
}

