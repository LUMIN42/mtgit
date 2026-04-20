import {useDeckContext} from "../../context/DeckUiContext.tsx";
import {DebouncedTextInput} from "../DebouncedTextInput.tsx";
import {FieldSection} from "./FieldSection.tsx";

export function DeckFilterSection() {
  const {cardFilterQuery, setCardFilterQuery} = useDeckContext();

  return (
    <FieldSection label="Card Filter:">
      <DebouncedTextInput
        size="xs"
        value={cardFilterQuery}
        onDebouncedChange={setCardFilterQuery}
        placeholder="type:creature cmc<=3"
        label="Scryfall Query"
        clearable={true}
        setValue={setCardFilterQuery}
      />
    </FieldSection>
  );
}

