import {DebouncedTextInput} from "../../DebouncedTextInput.tsx";
import {FieldSection} from "./FieldSection.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";

export function DeckFilterSection() {
  const {cardFilterQuery, setCardFilterQuery} = useDeckUiContext();

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

