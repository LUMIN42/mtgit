import {Anchor, Group} from "@mantine/core";
import {Tip} from "../Tip.tsx";
import {SearchBox} from "../SearchBox.tsx";
import {FieldSection} from "./FieldSection.tsx";
import {useDeckContext} from "../../context/DeckContext.tsx";

export function CardSearchSection() {
  const deck = useDeckContext();

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
      <SearchBox value={deck.searchString} onChange={deck.setSearchString} onSearch={() => deck.setIsSearching(true)}
                 size="xs"/>
    </FieldSection>
  );
}

