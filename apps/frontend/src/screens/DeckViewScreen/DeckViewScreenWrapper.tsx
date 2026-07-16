import {useParams} from "react-router-dom";

import {RepositoryProvider} from "../../context/RepositoryContext.tsx";

import {DeckViewScreenRouter} from "./DeckViewScreenRouter.tsx";
import {DeckUiProvider} from "../../context/DeckUiContext.tsx";
import {DeckDataProviderWrapper} from "../../context/DeckDataProviderWrapper.tsx";
import {RepositoryPreferencesProvider} from "../../context/RepositoryPreferencesContext.tsx";

export function DeckViewScreenWrapper() {
  const {deckId: rawDeckId} = useParams<{deckId: string}>();
  const deckId: string = rawDeckId!;

  return (
    <DeckUiProvider>
      <RepositoryProvider repositoryId={deckId}>
        <RepositoryPreferencesProvider repositoryId={deckId}>
          <DeckDataProviderWrapper>
            <DeckViewScreenRouter/>
          </DeckDataProviderWrapper>
        </RepositoryPreferencesProvider>
      </RepositoryProvider>
    </DeckUiProvider>
  );
}