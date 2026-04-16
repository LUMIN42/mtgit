import {useMemo} from 'react';
import {Alert, Button, Stack, Text} from "@mantine/core";
import {useQuery} from "@tanstack/react-query";
import {useDeckContext} from "../context/DeckContext.tsx";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/CardGroup.tsx";
import {searchScryfallCards} from "@mtgit/shared/scryfallSearch";
import type {CardWithTags} from "../types/cardWithTags.ts";

function hasScryfallOrderClause(query: string): boolean {
  return /(?:^|\s)(?:order|sort)(?::|=)\S+/i.test(query.trim());
}

function SearchResultsScreen() {
  const deck = useDeckContext();

  const submittedSearch = deck.submittedSearch;

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

  const cardsWithTags = useMemo<CardWithTags[]>(
    () => cards.map((card) => ({...card, tags: []})),
    [cards],
  );

  const handleSearchSubmit = (value: string) => {
    const trimmedValue = value.trim();
    deck.setSubmittedSearch(trimmedValue);
  };

  return (
    <Stack gap={"md"}>
      <Button onClick={() => deck.setIsSearching(false)} w={"fit-content"}>
        Return to Deck View
      </Button>
      <SearchBox
        value={deck.searchString ?? ''}
        onChange={deck.setSearchString}
        onSearch={handleSearchSubmit}
      />

      <Text size="sm" c="dimmed">
        {submittedSearch
          ? `Showing ${cards.length} result(s) for: ${submittedSearch}`
          : 'Type a search and press Enter or click the search icon.'}
      </Text>

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

      <CardGroup
        cards={cardsWithTags}
        displayMode={deck.displayMode}
        sortingMode={usesServerOrder ? undefined : deck.sortingMode}
        groupKey={submittedSearch || 'search-results'}
      />
    </Stack>
  );
}

export default SearchResultsScreen;
