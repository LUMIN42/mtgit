import {TableOfContents} from "@mantine/core";
import {FieldSection} from "./FieldSection.tsx";
import {type DeckSection} from "@mtgit/shared";
import {useDeckDataContext} from "../../../context/DeckDataContext.tsx";

export function DeckSectionsToc() {
  const {filteredDeck} = useDeckDataContext();
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

