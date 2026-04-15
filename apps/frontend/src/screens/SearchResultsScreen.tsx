import {useState} from 'react';
import {Alert, Stack, Text} from "@mantine/core";
import {useQuery} from "@tanstack/react-query";
import {useDeckContext} from "../context/DeckContext.tsx";
import {SearchBox} from "../components/SearchBox.tsx";
import {trpcClient} from "../trpcClient.ts";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";

function SearchResultsScreen() {
  const deck = useDeckContext();

  const [cards, setCards] = useState<ScryfallOracleCard[]>([]);
  const [submittedSearch, setSubmittedSearch] = useState('');

  const searchQuery = useQuery({
    queryKey: ['scryfall', 'searchByName', submittedSearch],
    enabled: submittedSearch.trim().length > 0,
    queryFn: async () => {
      const data = await trpcClient.scryfall.searchByName.query({
        name: submittedSearch,
        limit: 50,
      });

      setCards(data.ok ? data.cards : []);
      return data;
    },
  });

  const handleSearchSubmit = (value: string) => {
    const trimmedValue = value.trim();
    setSubmittedSearch(trimmedValue);

    if (!trimmedValue) {
      setCards([]);
    }
  };

  return (
    <Stack>
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
    </Stack>
  );
}

export default SearchResultsScreen;