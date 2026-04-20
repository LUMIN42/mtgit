/* eslint-disable react-refresh/only-export-components */
import {createContext, useContext, useEffect, useState} from "react";
import type {Dispatch, ReactNode, SetStateAction} from "react";
import type {Deck} from "../types/deck.ts";

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
  return typeof deck.name === "string"
    && !!deck.sections
    && typeof deck.sections === "object"
    && Array.isArray((deck.sections as { Main?: unknown }).Main);
}

export function DeckDataProvider({deck: initialDeck, children}: DeckDataProviderProps) {
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

  useEffect(() => {
    try {
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    } catch {
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
