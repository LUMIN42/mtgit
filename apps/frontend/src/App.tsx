import {useQuery} from "@tanstack/react-query";
import {CustomAppShell} from "./components/CustomAppShell.tsx";

import {useDeckContext} from "./context/DeckUiContext.tsx";
import {trpcClient} from "./trpcClient.ts";
// import BranchViewingScreen from "./screens/BranchViewingScreen.tsx";
import SearchResultsScreen from "./screens/SearchResultsScreen.tsx";
import {DeckViewScreen} from "./screens/DeckViewScreen.tsx";


function AppBody() {
  const deck = useDeckContext();

  return deck.isSearching ? <SearchResultsScreen/> : <DeckViewScreen />;
  // return <BranchViewingScreen/>;
}

function App() {
  useQuery({
    queryKey: ["hello"],
    queryFn: () => trpcClient.hello.query()
  });
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
