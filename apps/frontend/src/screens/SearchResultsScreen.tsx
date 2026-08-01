import {useEffect, useMemo, useState} from "react";
import {ActionIcon, Button, Center, Group, Loader, Stack, Text, TextInput} from "@mantine/core";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {useCardCache} from "../context/CardCacheContext.tsx";
import {useRepositoryPreferences} from "../context/RepositoryPreferencesContext.tsx";
import {IconCheck, IconPencil} from "@tabler/icons-react";
import {Link} from "react-router-dom";
import {useWindowScroll} from "@mantine/hooks";
import {useScryfallCardRetriever} from "../utils/scryfallSearch.ts";

export function SearchResultsScreen() {

  const {searchQuery, setSearchQuery} = useDeckUiContext();

  const {preferences: {defaultQuery}, updatePreferences} = useRepositoryPreferences();

  const [defaultQueryField, setDefaultQueryField] = useState(defaultQuery);

  const [editingDefaultQuery, setEditingDefaultQuery] = useState<boolean>(false);

  useEffect(() => {
    handleSearchSubmit();
  }, []);

  const {fetchMissingCards, tryGetCard} = useCardCache();

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
    const threshold = window.innerHeight;

    const atBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - threshold;

    if (atBottom) {
      fetchNextPage();
    }
  }, [scroll.y]);

  const {
    fetchNextPage,
    ids: cardIds,
    setQuery,
    isFetchingNextPage,
    isLoading: isLoadingScryfall,
    query: lockedInQuery
  } = useScryfallCardRetriever();

  useEffect(() => {
    document.title = `MTGit Card Search Results`;
  }, [lockedInQuery]);

  const redownloadedCards = cardIds
    .map(tryGetCard).filter(card => card !== undefined);

  const isLoadingRedownloaded = redownloadedCards.length !== cardIds.length;

  const isLoading = isLoadingScryfall || isLoadingRedownloaded;

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
    <Stack gap={"md"} maw={1200} mx={"auto"} w={"100%"}>
      <Button component={Link} to={".."} w={"fit-content"}>
        Return to Deck View
        {/*  todo rewrite as a chevron */}
      </Button>
      <SearchBox
        value={searchQuery}
        onChange={text => setSearchQuery(text)}
        onSearch={handleSearchSubmit}
        label={"Scryfall Search Query"}
      />

      <Group w="100%" gap={"xs"} align="center" c={editingDefaultQuery ? "inherit" : "dimmed"}>
        <Text size={editingDefaultQuery ? "md" : "xs"} fw={500}>
          Query Defaults:
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
        {lockedInQuery
          ? `Showing ${cardIds.length} result(s) for: ${lockedInQuery}`
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
        displayMode={"Images"}
      />

      {
        (isFetchingNextPage || isLoading) &&
        (<Center>
          <Loader size={"xl"}/>
        </Center>)
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
