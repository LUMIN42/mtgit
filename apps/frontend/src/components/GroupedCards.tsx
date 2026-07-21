import {Stack, Title} from "@mantine/core";
import {
  getGroupHeadingId,
  performGrouping,
  flatten, cardCountSortedGroup
} from "../utils/cardGrouping.ts";
import {CardGroup} from "./DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "./DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";

import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useDeckDataContext} from "../context/DeckDataContext.tsx";
import {cardCount} from "@mtgit/shared";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {useElementSize, useViewportSize} from "@mantine/hooks";
import {useRepositoryPreferences} from "../context/RepositoryPreferencesContext.tsx";

type GroupedCardsProps = {
  comparison?: boolean;
};

export function GroupedCards({comparison = false}: GroupedCardsProps) {
  const {groupingMode, sortingMode, setHoveredCardImageUrl, displayMode} = useDeckUiContext();

  const {width, ref} = useElementSize();

  const {width: viewportWidth} = useViewportSize();

  const {filteredDeck} = useDeckDataContext();

  const {preferences} = useRepositoryPreferences();

  let groups = performGrouping(
    filteredDeck,
    groupingMode,
    sortingMode
  );
  if (groupingMode === "color") {
    const allGroups = groups.flatMap(
      section => section.groups
    );

    const consumedColors = allGroups
      .filter(group => !group.heading.includes("Producer") && group.heading)
      .map(group => group.heading);

    groups = groups.map(section => {
      return {
        name: section.name,
        groups: section.groups.filter(group => consumedColors.some(color => group.heading.includes(color)))
      };
    });
  }

  const sections = groups;
  const pageCards = flatten(groups);


  const {
    oracleId,
    openModal,
    closeModal,
    moveLeft,
    moveRight,
    hasNextLeft,
    hasNextRight
  } = useCardSelectionManager();


  return (
    <>
      {/* Render all deck sections */}
      <Stack gap="md" ref={ref}>
        {sections.map(section => {
          // Skip empty sections
          // if (section.cards.length === 0) {
          //   return null;
          // }

          return (
            <Stack key={section.name} gap="xs">
              {/* Section heading with card count */}
              <Title
                order={3}
                fw={700}
                id={`deck-section-${section.name.toLowerCase()}`}
                data-deck-heading
                data-card-count={cardCount(filteredDeck[section.name]!)}
                data-heading-text={section.name}
                style={{
                  borderBottom: "1px solid black"
                }}
                ta={"center"}
              >
                {section.name} ({cardCount(filteredDeck[section.name]!)})
              </Title>

              {/* Render groups within the section */}
              {section.groups.map(group => {
                const cardCount = cardCountSortedGroup(group);
                const headingText =
                  groupingMode === "manaValue" && group.heading !== "Lands"
                    ? `Mana Value ${group.heading}`
                    : group.heading;

                return (
                  <Stack key={`${section.name}-${group.heading || "all"}`} gap="xs">
                    {/* Group heading if grouping is enabled */}
                    {(groupingMode !== "none" && section.name != "Commander") ? (
                      <Title
                        fw={600}
                        order={4}
                        ta={displayMode === "Text" ? "center" : "left"}
                        mt={displayMode === "Text" ? "xl" : 0}
                        id={getGroupHeadingId(groupingMode, section.name, group.heading)}
                        style={{
                          scrollMarginTop: groupingMode === "manaValue" ? "1rem" : undefined
                          // borderBottom: "1px solid lightgray"
                        }}
                        data-deck-heading
                        data-card-count={cardCount}
                        data-heading-text={headingText}
                      >
                        {headingText} ({cardCount} {cardCount === 1 ? "card" : "cards"})
                      </Title>
                    ) : null}

                    {/* Render cards in the group */}
                    <CardGroup
                      displayMode={displayMode}
                      cards={group.cards}
                      groupKey={`${group.heading}`}
                      onCardSelect={cardLoc => {
                        openModal(pageCards, cardLoc);
                      }}
                      onCardHover={setHoveredCardImageUrl}
                      sectionName={section.name}
                      widthOverride={width ?? viewportWidth * 0.8}
                      quicklyAdjustable={preferences.quickEdit}
                    />
                  </Stack>
                );
              })}
            </Stack>
          );
        })}
      </Stack>

      {/* Card details modal for selected card, supports navigation */}
      {oracleId
        &&
        (<CardDetailsModal oracle_id={oracleId}
          onClose={() => closeModal()}
          onPrev={moveLeft}
          onNext={moveRight}
          hasPrevious={hasNextLeft}
          hasNext={hasNextRight}
        />)
      }

    </>
  );
}
