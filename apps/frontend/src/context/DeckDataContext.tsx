import {
  createContext,
  useContext,
  useEffect, useState
} from "react";
import type {ReactNode} from "react";

import {HydratedDeck} from "@mtgit/shared";
import type {
  DeckCardCounts
} from "@mtgit/shared";

import {useScryfallCache} from "./ScryfallCacheContext";
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
 * -----------------------------
 * Helpers (kept OUTSIDE component)
 * -----------------------------
 */
// async function buildCardsAsync(
//   counts: CardCounts,
//   getCards: (ids: string[]) => Promise<(ScryfallOracleCard | undefined)[]>
// ): Promise<DeckCard[]> {
//   const ids = Object.keys(counts);
//   const cards = await getCards(ids);
//
//   const out: DeckCard[] = [];
//
//   for (let i = 0; i < ids.length; i++) {
//     const card = cards[i];
//     const count = counts[ids[i]];
//
//     if (card) {
//       out.push({
//         ...card,
//         count
//       });
//     }
//   }
//
//   return out;
// }

// async function buildSectionsAsync(
//   sections: DeckCardCounts,
//   getCards: (ids: string[]) => Promise<(ScryfallOracleCard | undefined)[]>,
//   tags: Record<string, string[]>
// ): Promise<DeckSections> {
//   const built: Partial<Record<DeckSectionName, DeckSection>> = {};
//
//   for (const [sectionName, counts] of Object.entries(sections)) {
//     const cards = await buildCardsAsync(counts as CardCounts, getCards);
//
//     const enriched = cards.map(card => ({
//       ...card,
//       tags: tags?.[card.oracle_id] ?? []
//     }));
//
//     built[sectionName as DeckSectionName] = new DeckSection(
//       sectionName as DeckSectionName,
//       enriched
//     );
//   }
//
//   if (!built.Main) {
//     built.Main = new DeckSection("Main", []);
//   }
//
//   return built as DeckSections;
// }

/**
 * -----------------------------
 * Context
 * -----------------------------
 */
export function DeckDataProviderInner({
  sections,
  children
}: DeckDataProviderProps) {
  const {usePartiallyReconstructedDeck} = useScryfallCache();
  const {repository, isLoading: isRepoLoading} = useRepositoryContext();
  const ui = useDeckUiContext();

  const [loading, setLoading] = useState(true);

  const {deck, isLoading: isReconstructingDeck} = usePartiallyReconstructedDeck(sections ?? {}, repository.tags);

  useEffect(() => {
    if (!isReconstructingDeck && !isRepoLoading) {
      setLoading(false);
    }

    if (isReconstructingDeck) {
      setLoading(true);
    }
  }, [isReconstructingDeck]);

  let filteredDeck = {};
  if (deck !== null) {
    filteredDeck = filterDeckByScryfallQuery(deck, ui.cardFilterQuery);
  }

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
 * -----------------------------
 * Hook
 * -----------------------------
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