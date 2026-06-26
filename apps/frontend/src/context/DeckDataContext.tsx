import {createContext, useContext, useEffect, useMemo, useState} from "react";
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
import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";
import {useDeckUiContext} from "./DeckUiContext.tsx";

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

export function DeckDataProvider({
  sections,
  children
}: DeckDataProviderProps) {
  const {getCards} = useScryfallCache();
  const {repository} = useRepositoryContext();
  const ui = useDeckUiContext();

  const [deck, setDeck] = useState<Deck>(() =>
    Deck.empty("Loading deck")
  );

  const [isLoading, setIsLoading] = useState(true);


  /**
   * 🔥 async version (bulk fetch friendly)
   */
  async function buildSectionsAsync(
    sections: DeckCardCounts,
    getCards: (
      ids: string[]
    ) => Promise<(ScryfallOracleCard | undefined)[]>
  ): Promise<DeckSections> {
    const built: Partial<Record<DeckSectionName, DeckSection>> = {};

    for (const [sectionName, counts] of Object.entries(sections)) {
      const cards = (await buildCardsAsync(counts as CardCounts, getCards))
        .map(card => {
          return {
            ...card,
            tags: repository.tags[card.oracle_id] ?? []
          };
        });

      built[sectionName as DeckSectionName] = new DeckSection(
        sectionName as DeckSectionName,
        cards
      );
    }

    if (!built.Main) {
      built.Main = new DeckSection("Main", []);
    }

    return built as DeckSections;
  }

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
        getCards
      );

      if (cancelled) {
        return;
      }

      setDeck(new Deck("Imported", deckSections));
      setIsLoading(false);
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [buildSectionsAsync, getCards, sections]);

  const filteredDeck = useMemo(
    () => filterDeckByScryfallQuery(deck, ui.cardFilterQuery),
    [deck,ui.cardFilterQuery]
  );

  return (
    <DeckDataContext.Provider value={{deck, isLoading, filteredDeck}}>
      {children}
    </DeckDataContext.Provider>
  );
}

/**
 * 🔥 batch-resolved card construction
 */
async function buildCardsAsync(
  counts: CardCounts,
  getCards: (
    ids: string[]
  ) => Promise<(ScryfallOracleCard | undefined)[]>
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

export function useDeckDataContext(): DeckDataContextValue {
  const context = useContext(DeckDataContext);

  if (!context) {
    throw new Error(
      "useDeckDataContext must be used within DeckProvider"
    );
  }

  return context;
}