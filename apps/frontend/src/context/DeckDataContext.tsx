/**
 * Exposes the hydrated (with card details) version of the edited branch.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import type {ReactNode} from "react";

import {HydratedDeck} from "@mtgit/shared";
import type {
  DeckCardCounts
} from "@mtgit/shared";

import {useCardCache} from "./CardCacheContext.tsx";
import {useRepositoryContext} from "./RepositoryContext.tsx";
import {useDeckUiContext} from "./DeckUiContext.tsx";

import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";

export interface DeckDataContextValue {
  deck: HydratedDeck;
  isLoading: boolean;
  filteredDeck: HydratedDeck;
}

export interface DeckDataProviderProps {
  sections?: DeckCardCounts | null;
  children: ReactNode;
}

const DeckDataContext = createContext<DeckDataContextValue>(
  {
    deck: {},
    filteredDeck: {},
    isLoading: true
  }
);

/**
 * Should be used as a part of {@link DeckDataProviderWrapper}.
 */
export function DeckDataProviderInner({
  sections,
  children
}: DeckDataProviderProps) {
  const {usePartiallyReconstructedDeck} = useCardCache();
  const {repository, isLoading: isRepoLoading} = useRepositoryContext();
  const ui = useDeckUiContext();


  const {deck, isLoading: isReconstructingDeck} = usePartiallyReconstructedDeck(sections ?? {}, repository.tags);

  const [loading, setLoading] = useState(true);


  let filteredDeck = {};
  if (deck !== null) {
    filteredDeck = filterDeckByScryfallQuery(deck, ui.cardFilterQuery);
  }

  // this overcomplicated mechanism prevents a one-frame gap between repo loading and deck reconstructing
  const loadingRef = useRef(isRepoLoading || isReconstructingDeck);
  useEffect(() => {
    loadingRef.current = isRepoLoading || isReconstructingDeck;

    if (isRepoLoading || isReconstructingDeck) {
      setLoading(true);
    }

    setTimeout(
      () => {
        setLoading(loadingRef.current);
      },
      100);
  }, [isReconstructingDeck, isRepoLoading]);

  return (
    <DeckDataContext.Provider
      value={{
        deck: deck ?? {},
        isLoading: loading,
        filteredDeck
      }}
    >
      {children}
    </DeckDataContext.Provider>
  );
}

/**
 * Exposes the hydrated (with card details) version of the edited branch.
 */
export function useDeckDataContext(): DeckDataContextValue {
  const context = useContext(DeckDataContext);

  if (!context) {
    throw new Error(
      "useDeckDataContext must be used within DeckDataProvider"
    );
  }

  return context;
}