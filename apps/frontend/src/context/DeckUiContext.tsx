import {Dispatch, ReactNode, SetStateAction, createContext, useContext, useState} from "react";
import type {DeckExportMode, DeckSectionName} from "@mtgit/shared";
import type {CardGroupingMode, CardSortMode} from "../types/grouping.ts";

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

  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;

  comparisonBranchName: string | null;
  setComparisonBranchName: Dispatch<SetStateAction<string | null>>;

  selectedBranchName: string;
  setSelectedBranchName: (n: string) => void;

  diffsOnly: boolean;
  setDiffsOnly: (value: boolean) => void;

  deckExportModalOpen: boolean;
  setDeckExportModalOpen: (value: boolean) => void;

  deckExportMode: DeckExportMode;
  setDeckExportMode: (value: DeckExportMode) => void;
}


const DeckUIContext = createContext<DeckUIContextValue | undefined>(undefined);
const SECTION_ORDER: DeckSectionName[] = ["Commander", "Main", "Considering"];


export function DeckUiProvider({children}: {children: ReactNode}) {
  const [viewMode, setViewMode] = useState<DeckViewMode>("Deck");
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>("Images");
  const [groupingMode, setGroupingMode] = useState<CardGroupingMode>("none");
  const [sortingMode, setSortingMode] = useState<CardSortMode>("name");
  const [cardFilterQuery, setCardFilterQuery] = useState("");
  const [hoveredCardImageUrl, setHoveredCardImageUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [comparisonBranchName, setComparisonBranchName] = useState<string | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string>(null!);
  const [diffsOnly, setDiffsOnly] = useState<boolean>(true);

  const [deckExportModalOpen, setDeckExportModalOpen] = useState<boolean>(false);

  // todo set to mtga if deck format is standard
  const [deckExportMode, setDeckExportMode] = useState<DeckExportMode>("MTGO");

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
    searchQuery,
    setSearchQuery,
    comparisonBranchName,
    setComparisonBranchName,

    selectedBranchName,
    setSelectedBranchName,

    diffsOnly,
    setDiffsOnly,

    deckExportModalOpen,
    setDeckExportModalOpen,

    deckExportMode,
    setDeckExportMode
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
