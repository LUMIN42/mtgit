import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type {ReactNode} from "react";

import {Deck, DeckSection} from "@mtgit/shared";
import type {
  CardCounts,
  DeckCard,
  DeckCardCounts,
  DeckSectionName,
  DeckSections
} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";

import {useScryfallCache} from "./ScryfallCacheContext";
import {useRepositoryContext} from "./RepositoryContext.tsx";
import {useDeckUiContext} from "./DeckUiContext.tsx";

import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";

export interface DeckDataContextValue {
  deck: Deck;
  isLoading: boolean;
  filteredDeck: Deck;
}

interface DeckDataProviderProps {
  sections?: DeckCardCounts | null;
  children: ReactNode;
}

const DeckDataContext = createContext<DeckDataContextValue | undefined>(
  undefined
);

/**
 * -----------------------------
 * Helpers (kept OUTSIDE component)
 * -----------------------------
 */
async function buildCardsAsync(
  counts: CardCounts,
  getCards: (ids: string[]) => Promise<(ScryfallOracleCard | undefined)[]>
): Promise<DeckCard[]> {
  const ids = Object.keys(counts);
  const cards = await getCards(ids);

  const out: DeckCard[] = [];

  for (let i = 0; i < ids.length; i++) {
    const card = cards[i];
    const count = counts[ids[i]];

    if (card) {
      out.push({
        ...card,
        count
      });
    }
  }

  return out;
}

async function buildSectionsAsync(
  sections: DeckCardCounts,
  getCards: (ids: string[]) => Promise<(ScryfallOracleCard | undefined)[]>,
  tags: Record<string, string[]>
): Promise<DeckSections> {
  const built: Partial<Record<DeckSectionName, DeckSection>> = {};

  for (const [sectionName, counts] of Object.entries(sections)) {
    const cards = await buildCardsAsync(counts as CardCounts, getCards);

    const enriched = cards.map(card => ({
      ...card,
      tags: tags?.[card.oracle_id] ?? []
    }));

    built[sectionName as DeckSectionName] = new DeckSection(
      sectionName as DeckSectionName,
      enriched
    );
  }

  if (!built.Main) {
    built.Main = new DeckSection("Main", []);
  }

  return built as DeckSections;
}

/**
 * -----------------------------
 * Context
 * -----------------------------
 */
export function DeckDataProvider({
  sections,
  children
}: DeckDataProviderProps) {
  const {getCards} = useScryfallCache();
  const {repository} = useRepositoryContext();
  const ui = useDeckUiContext();

  const [deck, setDeck] = useState(() =>
    Deck.empty("Loading deck")
  );

  const [isLoading, setIsLoading] = useState(true);

  /**
   * IMPORTANT:
   * Snapshot tags to avoid identity churn during async hydration
   */
  const tags = repository?.tags ?? {};

  /**
   * Hydrate deck only when inputs actually change
   */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!sections) {
        setDeck(Deck.empty("Sample deck"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const deckSections = await buildSectionsAsync(
        sections,
        getCards,
        tags ?? {}
      );

      if (cancelled) return;

      setDeck(new Deck(deckSections));
      setIsLoading(false);
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [sections, getCards, tags]);

  /**
   * Derived filtered deck (stable + memoized)
   */
  const filteredDeck = useMemo(() => {
    return filterDeckByScryfallQuery(deck, ui.cardFilterQuery);
  }, [deck, ui.cardFilterQuery]);

  return (
    <DeckDataContext.Provider
      value={{
        deck,
        isLoading,
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