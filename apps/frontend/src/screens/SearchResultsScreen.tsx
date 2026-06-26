import {useEffect, useMemo, useState} from "react";
import {Alert, Button, Center, Loader, Stack, Text} from "@mantine/core";
import {useQuery} from "@tanstack/react-query";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import {searchScryfallCards} from "@mtgit/shared/scryfallSearch";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";

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

  const uiContext = useDeckUiContext();

  const submittedSearch = uiContext.submittedSearch;
  const [searchInput, setSearchInput] = useState(submittedSearch);
  const [selection, setSelection] = useState<number | null>(null);

  useEffect(() => {
    setSearchInput(submittedSearch);
  }, [submittedSearch]);

  const usesServerOrder = hasScryfallOrderClause(submittedSearch);

  const searchQuery = useQuery({
    queryKey: ["scryfall", "search", submittedSearch, 50, 0],
    enabled: submittedSearch.trim().length > 0,
    queryFn: async () => searchScryfallCards(submittedSearch, 50, 0)
  });

  const cards = useMemo(
    () => (searchQuery.data?.ok ? searchQuery.data.cards : []),
    [searchQuery.data]
  );

  const showInitialLoading = searchQuery.isPending && submittedSearch.trim().length > 0 && cards.length === 0;
  const showRefreshLoading = searchQuery.isFetching && !showInitialLoading;

  const cardsWithTags = useMemo(
    () => cards.map(card => ({...card, count: 1, tags: []})),
    [cards]
  );

  const resultsGroup = useMemo(
    () => ({heading: "Results", cards: cardsWithTags}),
    [cardsWithTags]
  );

  const safeSelection = selection !== null && selection < cardsWithTags.length ? selection : null;

  const handleSearchSubmit = (value: string) => {
    const trimmedValue = value.trim();
    uiContext.setSubmittedSearch(trimmedValue);
    setSelection(null);
  };

  return (
    <Stack gap={"md"}>
      <Button onClick={() => uiContext.setIsSearching(false)} w={"fit-content"}>
        Return to Deck View
      </Button>
      <SearchBox
        value={searchInput}
        onChange={setSearchInput}
        onSearch={handleSearchSubmit}
        loading={searchQuery.isFetching}
      />

      <Text size="sm" c="dimmed">
        {submittedSearch
          ? `Showing ${cards.length} result(s) for: ${submittedSearch}`
          : "Type a search and press Enter or click the search icon."}
      </Text>

      {showRefreshLoading ? (
        <Center>
          <Loader type="dots" size="sm" />
        </Center>
      ) : null}

      {showInitialLoading ? (
        <Center py="xl">
          <Stack gap="xs" align="center">
            <Loader type="dots" size="lg" />
            <Text size="sm" c="dimmed">Loading cards from Scryfall...</Text>
          </Stack>
        </Center>
      ) : null}

      {searchQuery.isError ? (
        <Alert color="red" title="Search failed">
          {searchQuery.error instanceof Error ? searchQuery.error.message : "Unknown error"}
        </Alert>
      ) : null}

      {searchQuery.data && !searchQuery.data.ok ? (
        <Alert color="red" title="Search failed">
          {searchQuery.data.message}
        </Alert>
      ) : null}

      {!showInitialLoading ? (
        <CardGroup
          group={resultsGroup}
          sectionName="Main"
          displayMode={uiContext.displayMode}
          sortingMode={usesServerOrder ? undefined : uiContext.sortingMode}
          groupKey={submittedSearch || "search-results"}
          quicklyAdjustable
          onCardSelect={location => {
            const index = cardsWithTags.findIndex(card => card.oracle_id === location.oracleId);
            setSelection(index >= 0 ? index : null);
          }}
        />
      ) : null}

      <CardDetailsModal
        cards={cardsWithTags}
        index={safeSelection ?? 0}
        opened={safeSelection !== null}
        onClose={() => setSelection(null)}
        onIndexChange={setSelection}
      />
    </Stack>
  );
}

export default SearchResultsScreen;
