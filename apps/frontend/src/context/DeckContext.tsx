/* eslint-disable react-refresh/only-export-components */
import {createContext, useContext, useMemo, useState} from "react";
import type {Dispatch, ReactNode, SetStateAction} from "react";
import type {Deck, DeckSectionName} from "../types/deck.ts";
import type {CardGroupingMode, CardSortMode} from "../types/grouping.ts";
import {DeckDataProvider, useDeckDataContext} from "./DeckDataContext.tsx";
import type {DeckDataContextValue} from "./DeckDataContext.tsx";
import {filterDeckByScryfallQuery} from "../utils/scryfallQueryFilter.ts";

export type CardDisplayMode = "Images" | "Text";

interface DeckUIContextValue {
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

  isSearching: boolean;
  setIsSearching: Dispatch<SetStateAction<boolean>>;

  submittedSearch: string;
  setSubmittedSearch: Dispatch<SetStateAction<string>>;
}

type DeckContextValue = DeckDataContextValue & DeckUIContextValue;

const DeckUIContext = createContext<DeckUIContextValue | undefined>(undefined);
const SECTION_ORDER: DeckSectionName[] = ["Commander", "Main", "Considering"];

interface DeckProviderProps {
  deck: Deck;
  children: ReactNode;
}

function DeckUIProvider({children}: {children: ReactNode}) {
  const {deck} = useDeckDataContext();
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>("Images");
  const [groupingMode, setGroupingMode] = useState<CardGroupingMode>("none");
  const [sortingMode, setSortingMode] = useState<CardSortMode>("name");
  const [cardFilterQuery, setCardFilterQuery] = useState("");
  const [hoveredCardImageUrl, setHoveredCardImageUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [submittedSearch, setSubmittedSearch] = useState('');

  const filteredDeck = useMemo(
    () => filterDeckByScryfallQuery(deck, cardFilterQuery),
    [deck, cardFilterQuery],
  );

  const value: DeckUIContextValue = {
    sectionOrder: SECTION_ORDER,
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
    setSubmittedSearch,
  };

  return <DeckUIContext.Provider value={value}>{children}</DeckUIContext.Provider>;
}

export function DeckProvider({deck: initialDeck, children}: DeckProviderProps) {
  return (
    <DeckDataProvider deck={initialDeck}>
      <DeckUIProvider>{children}</DeckUIProvider>
    </DeckDataProvider>
  );
}

export function useDeckUIContext(): DeckUIContextValue {
  const context = useContext(DeckUIContext);

  if (!context) {
    throw new Error("useDeckUIContext must be used within DeckProvider");
  }

  return context;
}

export function useDeckContext(): DeckContextValue {
  const dataContext = useDeckDataContext();
  const uiContext = useDeckUIContext();
  return {
    ...dataContext,
    ...uiContext,
  };
}

export {useDeckDataContext} from "./DeckDataContext.tsx";

