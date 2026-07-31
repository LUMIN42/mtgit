import {Center, Skeleton, Stack, Title} from "@mantine/core";
import {memo, useMemo} from "react";
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

function GroupedCardsImpl() {
  const {groupingMode, sortingMode, setHoveredCardImageUrl, displayMode} = useDeckUiContext();
  const {width, ref} = useElementSize();
  const {width: viewportWidth} = useViewportSize();
  const {filteredDeck, isLoading} = useDeckDataContext();
  const {preferences} = useRepositoryPreferences();

  const groups = useMemo(
    () => {
      let nextGroups = performGrouping(
        filteredDeck,
        groupingMode,
        sortingMode
      );

      if (groupingMode !== "color") {
        return nextGroups;
      }

      const allGroups = nextGroups.flatMap(
        section => section.groups
      );

      const consumedColors = allGroups
        .filter(group => !group.heading.includes("Producer") && group.heading)
        .map(group => group.heading);

      nextGroups = nextGroups.map(section => {
        return {
          name: section.name,
          groups: section.groups.filter(group =>
            consumedColors.some(color => group.heading.includes(color)) ||
            !group.heading // commander
          )
        };
      });

      return nextGroups;
    },
    [filteredDeck, groupingMode, sortingMode]
  );

  const pageCards = useMemo(
    () => flatten(groups),
    [groups]
  );

  const widthOverride = useMemo(
    () => width ?? viewportWidth * 0.8,
    [width, viewportWidth]
  );

  const {
    oracleId,
    openModal,
    closeModal,
    moveLeft,
    moveRight,
    hasNextLeft,
    hasNextRight
  } = useCardSelectionManager();

  const renderedSections = useMemo(
    () => groups.map(section => {
      return (
        <Stack key={section.name} gap="xs">
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

          {section.groups.map(group => {
            const groupCardCount = cardCountSortedGroup(group);
            const headingText =
              groupingMode === "manaValue" && group.heading !== "Lands"
                ? `Mana Value ${group.heading}`
                : group.heading;

            return (
              <Stack key={`${section.name}-${group.heading || "all"}`} gap="xs">
                {(groupingMode !== "none" && section.name != "Commander") ? (
                  <Title
                    fw={600}
                    order={4}
                    ta={displayMode === "Text" ? "center" : "left"}
                    mt={displayMode === "Text" ? "xl" : 0}
                    id={getGroupHeadingId(groupingMode, section.name, group.heading)}
                    style={{
                      scrollMarginTop: groupingMode === "manaValue" ? "1rem" : undefined
                    }}
                    data-deck-heading
                    data-card-count={groupCardCount}
                    data-heading-text={headingText}
                  >
                    {headingText} ({groupCardCount} {groupCardCount === 1 ? "card" : "cards"})
                  </Title>
                ) : null}

                <CardGroup
                  displayMode={displayMode}
                  cards={group.cards}
                  groupKey={`${group.heading}`}
                  onCardSelect={cardLoc => {
                    openModal(pageCards, cardLoc);
                  }}
                  onCardHover={setHoveredCardImageUrl}
                  sectionName={section.name}
                  widthOverride={widthOverride}
                  quicklyAdjustable={preferences.quickEdit}
                />
              </Stack>
            );
          })}
        </Stack>
      );
    }),
    [
      groups,
      filteredDeck,
      groupingMode,
      displayMode,
      openModal,
      pageCards,
      setHoveredCardImageUrl,
      widthOverride,
      preferences.quickEdit
    ]
  );

  if (isLoading) {
    return <Center>
      <Skeleton h={"100vh"}/>
    </Center>;
  }

  return (
    <>
      <Stack gap="md" ref={ref}>
        {renderedSections}
      </Stack>

      {oracleId &&
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

export const GroupedCards = memo(GroupedCardsImpl);
