import {useMemo} from "react";
import {useParams} from "react-router-dom";

import {RepositoryProvider} from "../../context/RepositoryContext.tsx";

import {DeckViewScreenRouter} from "./DeckViewScreenRouter.tsx";
import {DeckUiProvider} from "../../context/DeckUiContext.tsx";
import {DeckDataProviderWrapper} from "../../context/DeckDataProviderWrapper.tsx";
import {RepositoryPreferencesProvider} from "../../context/RepositoryPreferencesContext.tsx";

/**
 * Context wrapper for {@link DeckViewScreenRouter}
 */
export function DeckViewScreenWrapper() {
  const {deckId: rawDeckId} = useParams<{deckId: string}>();
  const deckId = useMemo(
    () => rawDeckId ?? "",
    [rawDeckId]
  );

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