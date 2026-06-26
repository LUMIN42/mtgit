import type {Dispatch, ReactNode, SetStateAction} from "react";
import {createContext, useContext, useState} from "react";
import type {DeckSectionName} from "@mtgit/shared";
import type {CardGroupingMode, CardSortMode} from "../types/grouping.ts";
import type {DeckDataContextValue} from "./DeckDataContext.tsx";

export type CardDisplayMode = "Images" | "Text";
export type DeckViewMode = "Deck" | "Branches";

interface DeckUIContextValue {
  sectionOrder: DeckSectionName[];

  viewMode: DeckViewMode;
  setViewMode: Dispatch<SetStateAction<DeckViewMode>>;

  displayMode: CardDisplayMode;
  setDisplayMode: Dispatch<SetStateAction<CardDisplayMode>>;

  groupingMode: CardGroupingMode;
  setGroupingMode: Dispatch<SetStateAction<CardGroupingMode>>;

  sortingMode: CardSortMode;
  setSortingMode: Dispatch<SetStateAction<CardSortMode>>;

  cardFilterQuery: string;
  setCardFilterQuery: Dispatch<SetStateAction<string>>;

  hoveredCardImageUrl: string | null;
  setHoveredCardImageUrl: Dispatch<SetStateAction<string | null>>;

  isSearching: boolean;
  setIsSearching: Dispatch<SetStateAction<boolean>>;

  submittedSearch: string;
  setSubmittedSearch: Dispatch<SetStateAction<string>>;

  comparisonBranchName: string | null;
  setComparisonBranchName: Dispatch<SetStateAction<string | null>>;
}

type DeckContextValue = DeckDataContextValue & DeckUIContextValue;

const DeckUIContext = createContext<DeckUIContextValue | undefined>(undefined);
const SECTION_ORDER: DeckSectionName[] = ["Commander", "Main", "Considering"];

interface DeckProviderProps {
  children: ReactNode;
}

export function DeckUiProvider({children}: {children: ReactNode}) {
  const [viewMode, setViewMode] = useState<DeckViewMode>("Deck");
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>("Images");
  const [groupingMode, setGroupingMode] = useState<CardGroupingMode>("none");
  const [sortingMode, setSortingMode] = useState<CardSortMode>("name");
  const [cardFilterQuery, setCardFilterQuery] = useState("");
  const [hoveredCardImageUrl, setHoveredCardImageUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [comparisonBranchName, setComparisonBranchName] = useState(undefined);

  const value: DeckUIContextValue = {
    sectionOrder: SECTION_ORDER,
    viewMode,
    setViewMode,
    displayMode,
    setDisplayMode,
    groupingMode,
    setGroupingMode,
    sortingMode,
    setSortingMode,
    cardFilterQuery,
    setCardFilterQuery,
    hoveredCardImageUrl,
    setHoveredCardImageUrl,
    isSearching,
    setIsSearching,
    submittedSearch,
    setSubmittedSearch,
    comparisonBranchName,
    setComparisonBranchName
  };

  return <DeckUIContext.Provider value={value}>{children}</DeckUIContext.Provider>;
}

export function useDeckUiContext(): DeckUIContextValue {
  const context = useContext(DeckUIContext);

  if (!context) {
    throw new Error("useDeckUIContext must be used within DeckProvider");
  }

  return context;
}
