import {DebouncedTextInput} from "../DebouncedTextInput.tsx";
import {FieldSection} from "./FieldSection.tsx";

interface DeckFilterSectionProps {
  value: string;
  onDebouncedChange: (value: string) => void;
}

export function DeckFilterSection({value, onDebouncedChange}: DeckFilterSectionProps) {
  return (
    <FieldSection label="Card Filter:">
      <DebouncedTextInput
        size="xs"
        value={value}
        onDebouncedChange={onDebouncedChange}
        placeholder="type:creature cmc<=3"
        label="Scryfall Query"
      />
    </FieldSection>
  );
}

