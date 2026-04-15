import { useQuery } from '@tanstack/react-query';
import {CustomAppShell} from "./CustomAppShell.tsx";
import {
  Alert,
  Group,
  Text,
} from "@mantine/core";

import {DeckProvider, useDeckContext} from "./context/DeckContext.tsx";
import {SAMPLE_ORACLE_CARDS} from "./data/sampleOracleCards.ts";
import {DeckImportModal} from "./components/DeckImportModal.tsx";
import { trpcClient } from './trpcClient.ts';
import {DeckViewScreen} from "./screens/DeckViewScreen.tsx";
import SearchResultsScreen from "./screens/SearchResultsScreen.tsx";


function AppBody() {
  const deck = useDeckContext();

  return deck.isSearching ? <SearchResultsScreen/> : <DeckViewScreen />;
}

function App() {
  const helloQuery = useQuery({
    queryKey: ['hello'],
    queryFn: () => trpcClient.hello.query(),
  });

  const helloMessage = helloQuery.isPending
    ? 'Loading tRPC hello endpoint...'
    : helloQuery.isError
      ? `tRPC error: ${helloQuery.error instanceof Error ? helloQuery.error.message : 'unknown error'}`
      : helloQuery.data.message;

  return (
    <DeckProvider deck={SAMPLE_ORACLE_CARDS}>
      <CustomAppShell>
        <Group>
          <DeckImportModal/>
        </Group>

        <Alert variant="light" title="tRPC hello">
          <Text size="sm">{helloMessage}</Text>
        </Alert>

        <AppBody/>

      </CustomAppShell>
    </DeckProvider>
  );
}

export default App;
