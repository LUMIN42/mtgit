import {useEffect, useMemo, useState} from "react";
import {ActionIcon, Button, Group, Loader, Stack, Text, TextInput} from "@mantine/core";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import {useScryfallCardRetriever} from "@mtgit/shared/scryfallSearch";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {useRepositoryPreferences} from "../context/RepositoryPreferencesContext.tsx";
import {IconCheck, IconPencil} from "@tabler/icons-react";
import {Link} from "react-router-dom";
import {useWindowScroll} from "@mantine/hooks";

// todo make sure to handle tags properly here
function hasScryfallOrderClause(query: string): boolean {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .some(token =>
      token.startsWith("order:")
      || token.startsWith("order=")
      || token.startsWith("sort:")
      || token.startsWith("sort=")
    );
}

export function SearchResultsScreen() {

  const {searchQuery, setSearchQuery} = useDeckUiContext();

  const {preferences: {defaultQuery}, updatePreferences} = useRepositoryPreferences();

  const [defaultQueryField, setDefaultQueryField] = useState(defaultQuery);

  const [editingDefaultQuery, setEditingDefaultQuery] = useState<boolean>(false);

  useEffect(() => {
    handleSearchSubmit();
  }, []);

  const {fetchMissingCards, tryGetCard} = useScryfallCache();

  const {
    oracleId,
    openModal,
    closeModal,
    moveLeft,
    moveRight,
    hasNextLeft,
    hasNextRight
  } = useCardSelectionManager();

  const [scroll] = useWindowScroll();

  useEffect(() => {
    const atBottom =
      window.innerHeight + scroll.y >=
      document.documentElement.scrollHeight - 100; // 100px threshold

    if (atBottom) {
      console.log("at bottom!");
      fetchNextPage();
    }
  }, [scroll.y]);

  const {fetchNextPage, ids: cardIds, setQuery, fetching, loading} = useScryfallCardRetriever();

  const redownloadedCards = cardIds
    .map(tryGetCard).filter(card => card !== undefined);

  useEffect(() => {
    fetchMissingCards(cardIds);
  }, [cardIds]);


  const cardsWithTags = useMemo(
    () => redownloadedCards.map(card => ({...card, tags: []})),
    [redownloadedCards]
  );


  const handleSearchSubmit = () => {
    setQuery(`${defaultQueryField} ${searchQuery}`);

    if (defaultQueryField) {
      updatePreferences({
        defaultQuery: defaultQueryField
      });
    }
  };

  return (
    <Stack gap={"md"} maw={1200} mx={"auto"}>
      <Button component={Link} to={".."} w={"fit-content"}>
        Return to Deck View
        {/*  todo rewrite as a chevron */}
      </Button>
      <SearchBox
        value={searchQuery}
        onChange={text => setSearchQuery(text)}
        onSearch={handleSearchSubmit}
        placeholder={"Scryfall Search Query"}
        label={"Scryfall Search Query"}
      />

      <Group w="100%" gap={"xs"} align="center" c={editingDefaultQuery ? "inherit" : "dimmed"}>
        <Text size={editingDefaultQuery ? "md" : "xs"} fw={500}>
          Default Query:
        </Text>

        {editingDefaultQuery ? (
          <>
            <TextInput
              value={defaultQueryField}
              onInput={event => setDefaultQueryField(event.currentTarget.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              style={{flex: 1}}
            />

            <ActionIcon
              variant={"gradient"}
              onClick={() => {
                handleSearchSubmit();
                setEditingDefaultQuery(false);
              }}
            >
              <IconCheck/>
            </ActionIcon>
          </>
        ) : (
          <>
            <Text size="xs">
              {defaultQueryField}
            </Text>
            <ActionIcon
              variant="white"
              size="xs"
              onClick={() => setEditingDefaultQuery(true)}
            >
              <IconPencil size={14} color="var(--mantine-color-dimmed)"/>
            </ActionIcon>
          </>
        )}
      </Group>


      <Text size="sm" c="dimmed">
        {searchQuery
          ? `Showing ${cardIds.length} result(s) for: ${searchQuery}`
          : "Type a search and press Enter or click the search icon."}
      </Text>
      <CardGroup
        cards={cardsWithTags}
        sectionName="Main"
        quicklyAdjustable
        onCardSelect={location => {
          openModal(
            // location set to empty, since there is only one location, thus is not needed
            cardIds
              .map(oracle_id => {
                return {oracle_id, location: {}};
              }),
            {oracle_id: location.oracle_id, location: {}}
          );
        }}
        minWidth={190}
      />

      {
        (fetching || loading) &&
          <Loader size={"xl"} mx={"auto"} w={"100%"}/>
      }


      {
        oracleId &&
        (<CardDetailsModal onClose={closeModal}
          oracle_id={oracleId}
          onPrev={moveLeft}
          onNext={moveRight}
          hasPrevious={hasNextLeft}
          hasNext={hasNextRight}
        />)
      }

    </Stack>
  );
}
