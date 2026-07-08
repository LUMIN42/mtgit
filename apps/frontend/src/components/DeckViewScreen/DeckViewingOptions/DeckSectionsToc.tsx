import {TableOfContents} from "@mantine/core";
import {FieldSection} from "./FieldSection.tsx";
import {useDeckDataContext} from "../../../context/DeckDataContext.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";
import {useLayoutEffect, useRef} from "react";

export function DeckSectionsToc() {
  const {filteredDeck} = useDeckDataContext();

  const {groupingMode} = useDeckUiContext();

  // const tocRefreshKey = Object.entries(filteredDeck)
  //   .map(([sectionName, cards]) => `${sectionName}:${cards?.length ?? 0}`)
  //   .join("|");


  const reinitializeRef = useRef(() => {
  });

  useLayoutEffect(() => {
    reinitializeRef.current();
  }, [filteredDeck, groupingMode]);

  return (
    <FieldSection label="Deck Sections:">
      <TableOfContents
        reinitializeRef={reinitializeRef}
        mt="xs"
        variant="light"
        scrollSpyOptions={{
          selector: "[data-deck-heading='true']"
        }}

        w={"fit-content"}

        // todo understand this line
        getControlProps={({data}) => {
          const elm = data.getNode();
          const count = elm.getAttribute("data-card-count") ?? "0";
          const heading = elm.getAttribute("data-heading-text") ?? "";

          return {
            component: "a",
            href: `#${data.id}`,
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1rem 3rem",
              gap: "0.5rem",
              alignItems: "center"
            },
            children: (
              <>
                <span
                  // style={{textAlign: "right"}}
                >
                  {heading}
                </span>
                <span style={{textAlign: "right"}}>
                  {count}
                </span>
                <span>
                  {count === "1" ? "card" : "cards"}
                </span>
              </>
            )
          };
        }}


      />
    </FieldSection>
  );
}

