import {createContext, useContext, useEffect, useMemo, useState} from "react";
import type {Dispatch, ReactNode, SetStateAction} from "react";
import type {Deck, DeckSectionName} from "../types/deck.ts";
import type {CardGroupingMode, CardSortMode} from "../types/grouping.ts";
import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";

export type CardDisplayMode = "Images" | "Text";

interface DeckContext {
  sectionOrder: DeckSectionName[];
  displayMode: CardDisplayMode;
  setDisplayMode: Dispatch<SetStateAction<CardDisplayMode>>;
  groupingMode: CardGroupingMode;
  setGroupingMode: Dispatch<SetStateAction<CardGroupingMode>>;
  sortingMode: CardSortMode;
  setSortingMode: Dispatch<SetStateAction<CardSortMode>>;
  cardFilterQuery: string;
  setCardFilterQuery: Dispatch<SetStateAction<string>>;
  filteredDeck: Deck;
  hoveredCardImageUrl: string | null;
  setHoveredCardImageUrl: Dispatch<SetStateAction<string | null>>;

  deck: Deck;
  setDeck: Dispatch<SetStateAction<Deck>>;

  isSearching: boolean;
  setIsSearching: Dispatch<SetStateAction<boolean>>;

  submittedSearch: string;
  setSubmittedSearch: Dispatch<SetStateAction<string>>;
}

const DeckContext = createContext<DeckContext | undefined>(undefined);
const DECK_STORAGE_KEY = "mtgit.deck";

function isDeckLike(value: unknown): value is Deck {
  if (!value || typeof value !== "object") {
    return false;
  }

  const deck = value as Partial<Deck>;
  return typeof deck.name === "string"
    && !!deck.sections
    && typeof deck.sections === "object"
    && Array.isArray((deck.sections as { Main?: unknown }).Main);
}

interface OracleCardsProviderProps {
  deck: Deck;
  children: ReactNode;
}

export function DeckProvider({deck: initialDeck, children}: OracleCardsProviderProps) {
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>("Images");
  const [groupingMode, setGroupingMode] = useState<CardGroupingMode>("none");
  const [sortingMode, setSortingMode] = useState<CardSortMode>("name");
  const [cardFilterQuery, setCardFilterQuery] = useState("");
  const [hoveredCardImageUrl, setHoveredCardImageUrl] = useState<string | null>(null);
  const sectionOrder: DeckSectionName[] = ["Commander", "Main", "Considering"];
  const [isSearching, setIsSearching] = useState(false);
  const [submittedSearch, setSubmittedSearch] = useState('');


  const [deck, setDeck] = useState<Deck>(() => {
    try {
      const rawDeck = localStorage.getItem(DECK_STORAGE_KEY);
      if (!rawDeck) {
        return initialDeck;
      }

      const parsedDeck = JSON.parse(rawDeck) as unknown;
      return isDeckLike(parsedDeck) ? parsedDeck : initialDeck;
    } catch {
      return initialDeck;
    }
  });

  const filteredDeck = useMemo(
    () => filterDeckByScryfallQuery(deck, cardFilterQuery),
    [deck, cardFilterQuery],
  );

  useEffect(() => {
    try {
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    } catch {
      // Ignore storage failures to keep app usable in restricted environments.
    }
  }, [deck]);

  return (
    <DeckContext.Provider
      value={{
        deck,
        setDeck,
        sectionOrder,
        displayMode,
        setDisplayMode,
        groupingMode,
        setGroupingMode,
        sortingMode,
        setSortingMode,
        cardFilterQuery,
        setCardFilterQuery,
        filteredDeck,
        hoveredCardImageUrl,
        setHoveredCardImageUrl,

        isSearching,
        setIsSearching,

        submittedSearch,
        setSubmittedSearch
      }}
    >
      {children}
    </DeckContext.Provider>
  );
}

export function useDeckContext(): DeckContext {
  const context = useContext(DeckContext);

  if (!context) {
    throw new Error("useOracleCards must be used within OracleCardsProvider");
  }

  return context;
}
