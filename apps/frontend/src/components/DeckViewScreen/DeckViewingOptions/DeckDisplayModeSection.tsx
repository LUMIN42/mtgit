import {Box, SegmentedControl} from "@mantine/core";
import type {CardDisplayMode} from "../../../context/DeckUiContext.tsx";

interface DeckDisplayModeSectionProps {
  value: CardDisplayMode;
  onToggle: () => void;
}

export function DeckDisplayModeSection({value, onToggle}: DeckDisplayModeSectionProps) {
  return (
    <Box onMouseDownCapture={onToggle}>
      <SegmentedControl
        fullWidth
        size="xs"
        value={value}
        data={[
          {label: "Images", value: "Images"},
          {label: "Text", value: "Text"}
        ]}
      />
    </Box>
  );
}

