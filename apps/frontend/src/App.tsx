import { useQuery } from '@tanstack/react-query';
import {CustomAppShell} from "./components/CustomAppShell.tsx";
import {
  Alert,
  Text,
} from "@mantine/core";

import {useDeckContext} from "./context/DeckContext.tsx";
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
    <CustomAppShell>
      {/*<Alert variant="light" title="tRPC hello">*/}
      {/*  <Text size="sm">{helloMessage}</Text>*/}
      {/*</Alert>*/}

      <AppBody/>

    </CustomAppShell>
  );
}

export default App;
