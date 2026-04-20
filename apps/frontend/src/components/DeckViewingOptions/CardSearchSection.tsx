import {Anchor, Group} from "@mantine/core";
import {useState} from "react";
import {Tip} from "../Tip.tsx";
import {SearchBox} from "../SearchBox.tsx";
import {FieldSection} from "./FieldSection.tsx";
import {useDeckContext} from "../../context/DeckUiContext.tsx";

export function CardSearchSection() {
  const deck = useDeckContext();
  const [searchString, setSearchString] = useState('');

  function startSearch(rawValue: string) {
    const trimmedValue = rawValue.trim();
    deck.setIsSearching(true);
    deck.setSubmittedSearch(trimmedValue);
  }

  return (
    <FieldSection
      label={
        <Group gap="xs">
          <span>Scryfall Search</span>
          <Tip>
            syntax guide at:{" "}
            <Anchor href="https://scryfall.com/docs/syntax" target="_blank">
              scryfall.com/docs/syntax
            </Anchor>
          </Tip>
          :
        </Group>
      }
    >
      <SearchBox
        value={searchString}
        onChange={setSearchString}
        onSearch={startSearch}
        size="xs"
      />
    </FieldSection>
  );
}
