import {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Center, Loader, Stack, Text} from "@mantine/core";
import {useQuery} from "@tanstack/react-query";
import {useDeckContext} from "../context/DeckUiContext.tsx";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/CardGroup.tsx";
import {CardDetailsModal} from "../components/CardDetailsModal.tsx";
import {searchScryfallCards} from "@mtgit/shared/scryfallSearch";

function hasScryfallOrderClause(query: string): boolean {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .some((token) =>
      token.startsWith('order:')
      || token.startsWith('order=')
      || token.startsWith('sort:')
      || token.startsWith('sort='),
    );
}

function SearchResultsScreen() {
  const deck = useDeckContext();

  const submittedSearch = deck.submittedSearch;
  const [searchInput, setSearchInput] = useState(submittedSearch);
  const [selection, setSelection] = useState<number | null>(null);

  useEffect(() => {
    setSearchInput(submittedSearch);
  }, [submittedSearch]);

  const usesServerOrder = hasScryfallOrderClause(submittedSearch);

  const searchQuery = useQuery({
    queryKey: ['scryfall', 'search', submittedSearch, 50, 0],
    enabled: submittedSearch.trim().length > 0,
    queryFn: async () => searchScryfallCards(submittedSearch, 50, 0),
  });

  const cards = useMemo(
    () => (searchQuery.data?.ok ? searchQuery.data.cards : []),
    [searchQuery.data],
  );

  const showInitialLoading = searchQuery.isPending && submittedSearch.trim().length > 0 && cards.length === 0;
  const showRefreshLoading = searchQuery.isFetching && !showInitialLoading;

  const cardsWithTags = useMemo(
    () => cards.map((card) => ({...card, tags: []})),
    [cards],
  );

  const safeSelection = selection !== null && selection < cardsWithTags.length ? selection : null;

  const handleSearchSubmit = (value: string) => {
    const trimmedValue = value.trim();
    deck.setSubmittedSearch(trimmedValue);
    setSelection(null);
  };

  return (
    <Stack gap={"md"}>
      <Button onClick={() => deck.setIsSearching(false)} w={"fit-content"}>
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
          : 'Type a search and press Enter or click the search icon.'}
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
          {searchQuery.error instanceof Error ? searchQuery.error.message : 'Unknown error'}
        </Alert>
      ) : null}

      {searchQuery.data && !searchQuery.data.ok ? (
        <Alert color="red" title="Search failed">
          {searchQuery.data.message}
        </Alert>
      ) : null}

      {!showInitialLoading ? (
        <CardGroup
          cards={cardsWithTags}
          displayMode={deck.displayMode}
          sortingMode={usesServerOrder ? undefined : deck.sortingMode}
          groupKey={submittedSearch || 'search-results'}
          onCardSelect={(_, index) => setSelection(index)}
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
