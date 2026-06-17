import {createContext, useContext} from "react";
import type {ReactNode} from "react";
import {Deck, DeckSection} from "@mtgit/shared";
import type {CardCounts, DeckCard, DeckCardAmounts, DeckSectionName, DeckSections} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";
import {useScryfallCache} from "./ScryfallCacheContext";

export interface DeckDataContextValue {
  deck: Deck;
}

interface DeckDataProviderProps {
  sections?: DeckCardAmounts | null;
  children: ReactNode;
}

const DeckDataContext = createContext<DeckDataContextValue | undefined>(undefined);

export function DeckDataProvider({sections, children}: DeckDataProviderProps) {
  const {getCard} = useScryfallCache();

  const deck = !sections
    ? Deck.empty("Sample deck")
    : new Deck("Imported", buildSections(sections, getCard));

  return <DeckDataContext.Provider value={{deck}}>{children}</DeckDataContext.Provider>;
}

function buildSections(
  sections: DeckCardAmounts,
  getCard: (oracleId: string) => ScryfallOracleCard | undefined
): DeckSections {
  const built: Partial<Record<DeckSectionName, DeckSection>> = {};

  for (const [sectionName, counts] of Object.entries(sections)) {
    const items = buildCards(counts as CardCounts, getCard);
    built[sectionName as DeckSectionName] = new DeckSection(sectionName as DeckSectionName, items);
  }

  if (!built.Main) {
    built.Main = new DeckSection("Main", []);
  }

  return built as DeckSections;
}

function buildCards(
  counts: CardCounts,
  getCard: (oracleId: string) => ScryfallOracleCard | undefined
): DeckCard[] {
  const out: DeckCard[] = [];
  for (const [oracleId, count] of Object.entries(counts)) {
    const base = getCard(oracleId);
    if (base) {
      out.push({...base, count});
    }
  }
  return out;
}

export function useDeckDataContext(): DeckDataContextValue {
  const context = useContext(DeckDataContext);

  if (!context) {
    throw new Error("useDeckDataContext must be used within DeckProvider");
  }

  return context;
}
