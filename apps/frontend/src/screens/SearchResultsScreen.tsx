import {useEffect, useMemo, useState} from "react";
import {ActionIcon, Alert, Button, Center, Group, Loader, Stack, Text, TextInput} from "@mantine/core";
import {useQuery} from "@tanstack/react-query";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import {searchScryfallCards} from "@mtgit/shared/scryfallSearch";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {useScryfallCache} from "../context/ScryfallCacheContext.tsx";
import {useRepositoryPreferences} from "../context/RepositoryPreferencesContext.tsx";
import {IconCheck, IconPencil} from "@tabler/icons-react";

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

  const {setIsSearching, searchQuery, setSearchQuery} = useDeckUiContext();

  const {preferences: {defaultQuery}, updatePreferences} = useRepositoryPreferences();

  const [defaultQueryField, setDefaultQueryField] = useState(defaultQuery);

  const [editingDefaultQuery, setEditingDefaultQuery] = useState<boolean>(false);

  const [fullSearchQuery, setFullSearchQuery] = useState<string>();

  useEffect(() => {
    handleSearchSubmit();
  }, []);

  const {fetchMissingCards} = useScryfallCache();

  const {
    oracleId,
    openModal,
    closeModal,
    moveLeft,
    moveRight,
    hasNextLeft,
    hasNextRight
  } = useCardSelectionManager();

  const usesServerOrder = hasScryfallOrderClause(searchQuery);

  const searchQueryHook = useQuery({
    queryKey: ["scryfall", "search", fullSearchQuery, 50, 0],
    enabled: searchQuery.trim().length > 0,
    queryFn: async () => searchScryfallCards(fullSearchQuery, 50, 0)
  });

  const cards = useMemo(
    () => (searchQueryHook.data?.ok ? searchQueryHook.data.cards : []),
    [searchQueryHook.data]
  );

  useEffect(() => {
    fetchMissingCards(cards.map(card => card.oracle_id));
  }, [cards]);


  const showInitialLoading = searchQueryHook.isPending && searchQuery.trim().length > 0 && cards.length === 0;
  const showRefreshLoading = searchQueryHook.isFetching && !showInitialLoading;

  const cardsWithTags = useMemo(
    () => cards.map(card => ({...card, count: 1, tags: []})),
    [cards]
  );

  const resultsGroup = useMemo(
    () => ({heading: "Results", cards: cardsWithTags}),
    [cardsWithTags]
  );


  const handleSearchSubmit = () => {
    setFullSearchQuery(`${searchQuery} ${defaultQueryField}`);

    updatePreferences({
      defaultQuery: defaultQueryField
    });
  };

  return (
    <Stack gap={"md"} maw={1200} mx={"auto"}>
      <Button onClick={() => setIsSearching(false)} w={"fit-content"}>
        Return to Deck View
        {/*  todo rewrite as a chevron */}
      </Button>
      <SearchBox
        value={searchQuery}
        onChange={text => setSearchQuery(text)}
        onSearch={handleSearchSubmit}
        loading={searchQueryHook.isFetching}
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
              <IconPencil size={14} color="var(--mantine-color-dimmed)" />
            </ActionIcon>
          </>
        )}
      </Group>


      <Text size="sm" c="dimmed">
        {searchQuery
          ? `Showing ${cards.length} result(s) for: ${fullSearchQuery}`
          : "Type a search and press Enter or click the search icon."}
      </Text>

      {showRefreshLoading ? (
        <Center>
          <Loader type="dots" size="sm"/>
        </Center>
      ) : null}

      {showInitialLoading ? (
        <Center py="xl">
          <Stack gap="xs" align="center">
            <Loader type="dots" size="lg"/>
            <Text size="sm" c="dimmed">Loading cards from Scryfall...</Text>
          </Stack>
        </Center>
      ) : null}

      {searchQueryHook.isError ? (
        <Alert color="red" title="Search failed">
          {searchQueryHook.error instanceof Error ? searchQueryHook.error.message : "Unknown error"}
        </Alert>
      ) : null}

      {searchQueryHook.data && !searchQueryHook.data.ok ? (
        <Alert color="red" title="Search failed">
          {searchQueryHook.data.message}
        </Alert>
      ) : null}

      {!showInitialLoading ? (
        <CardGroup
          group={resultsGroup}
          sectionName="Main"
          groupKey={searchQuery || "search-results"}
          quicklyAdjustable
          onCardSelect={location => {
            openModal(
              // location set to empty, since there is only one location, thus is not needed
              cards
                .map(card => {
                  return {oracle_id: card.oracle_id, location: {}};
                }),
              {oracle_id: location.oracle_id, location: {}}
            );
          }}
          minWidth={190}
        />
      ) : null}

      <CardDetailsModal onClose={closeModal}
        oracle_id={oracleId}
        onPrev={moveLeft}
        onNext={moveRight}
        hasPrevious={hasNextLeft}
        hasNext={hasNextRight}
      />
    </Stack>
  );
}
