/* eslint-disable react-refresh/only-export-components */
import {createContext, useContext, useEffect, useState} from "react";
import type {Dispatch, ReactNode, SetStateAction} from "react";
import type {Deck, DeckSectionName, DeckCard} from "@mtgit/shared";
import {DeckSection} from "@mtgit/shared";

export interface DeckDataContextValue {
  deck: Deck;
  setDeck: Dispatch<SetStateAction<Deck>>;
}

interface DeckDataProviderProps {
  deck: Deck;
  children: ReactNode;
}

const DeckDataContext = createContext<DeckDataContextValue | undefined>(undefined);
const DECK_STORAGE_KEY = "mtgit.deck";

function isDeckLike(value: unknown): value is Deck {
  if (!value || typeof value !== "object") {
    return false;
  }

  const deck = value as Partial<Deck>;
  const mainSection = (deck.sections as {Main?: unknown}).Main;

  return typeof deck.name === "string"
    && !!deck.sections
    && typeof deck.sections === "object"
    && (mainSection instanceof DeckSection || (Array.isArray(mainSection) && mainSection.length >= 0));
}

function reconstructDeckSections(sections: Deck["sections"]): Deck["sections"] {
  const reconstructed: Deck["sections"] = {
    Main: sections.Main instanceof DeckSection ? sections.Main : new DeckSection("Main", (sections.Main as unknown as DeckCard[]) ?? [])
  };

  const sectionNames: DeckSectionName[] = ["Commander", "Sideboard", "Considering"];
  for (const sectionName of sectionNames) {
    const section = sections[sectionName];
    if (section) {
      reconstructed[sectionName] = section instanceof DeckSection ? section : new DeckSection(sectionName, (section as unknown as DeckCard[]) ?? []);
    }
  }

  return reconstructed;
}

export function DeckDataProvider({deck: initialDeck, children}: DeckDataProviderProps) {
  const [deck, setDeck] = useState<Deck>(() => {
    try {
      const rawDeck = localStorage.getItem(DECK_STORAGE_KEY);
      if (!rawDeck) {
        return initialDeck;
      }

      const parsedDeck = JSON.parse(rawDeck) as unknown;
      if (!isDeckLike(parsedDeck)) {
        return initialDeck;
      }

      return {
        ...parsedDeck,
        sections: reconstructDeckSections(parsedDeck.sections)
      };
    }
    catch {
      return initialDeck;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    }
    catch {
      // Ignore storage failures to keep app usable in restricted environments.
    }
  }, [deck]);

  return <DeckDataContext.Provider value={{deck, setDeck}}>{children}</DeckDataContext.Provider>;
}

export function useDeckDataContext(): DeckDataContextValue {
  const context = useContext(DeckDataContext);

  if (!context) {
    throw new Error("useDeckDataContext must be used within DeckProvider");
  }

  return context;
}
