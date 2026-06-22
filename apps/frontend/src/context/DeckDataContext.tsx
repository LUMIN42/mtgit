import {createContext, useContext, useEffect, useState} from "react";
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

export interface DeckDataContextValue {
  deck: Deck;
  isLoading: boolean;
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

  const [deck, setDeck] = useState<Deck>(() =>
    Deck.empty("Loading deck")
  );

  const [isLoading, setIsLoading] = useState(true);

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
  }, [sections, getCards]);

  return (
    <DeckDataContext.Provider value={{deck, isLoading}}>
      {children}
    </DeckDataContext.Provider>
  );
}

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
    const cards = await buildCardsAsync(counts as CardCounts, getCards);

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