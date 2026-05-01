import {TableOfContents} from "@mantine/core";
import {useDeckContext} from "../../context/DeckUiContext.tsx";
import {FieldSection} from "./FieldSection.tsx";
import {DeckSection} from "@mtgit/shared";

export function DeckSectionsToc() {
  const {filteredDeck} = useDeckContext();
  const tocRefreshKey = Object.entries(filteredDeck.sections as Record<string, DeckSection | undefined>)
    .map(([sectionName, cards]) => `${sectionName}:${cards?.length ?? 0}`)
    .join("|");

  return (
    <FieldSection label="Deck Sections:">
      <TableOfContents
        key={tocRefreshKey}
        mt="xs"
        variant="light"
        scrollSpyOptions={{
          selector: "[data-deck-heading='true']"
        }}
        getControlProps={({data}) => ({
          component: "a",
          href: `#${data.id}`,
          children: data.value
        })}
      />
    </FieldSection>
  );
}

