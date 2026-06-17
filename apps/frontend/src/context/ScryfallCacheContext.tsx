import {createContext, useContext, useState} from "react";
import type {ReactNode} from "react";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";

type ScryfallCacheValue = {
  getCard: (id: string) => ScryfallOracleCard | undefined;
  getCards: (ids: string[]) => (ScryfallOracleCard | undefined)[];
  setCard: (card: ScryfallOracleCard) => void;
  setCards: (cards: ScryfallOracleCard[]) => void;
  clear: () => void;
};

const ScryfallCacheContext = createContext<ScryfallCacheValue | undefined>(undefined);

export function ScryfallCacheProvider({children}: {children: ReactNode}) {
  const [map] = useState<Record<string, ScryfallOracleCard>>(() => ({}));

  const getCard = (id: string) => {
    return map[id];
  };

  const getCards = (ids: string[]) => {
    return ids.map(i => map[i]);
  };

  const setCard = (card: ScryfallOracleCard) => {
    map[card.oracle_id] = card;
  };

  const setCards = (cards: ScryfallOracleCard[]) => {
    for (const c of cards) {
      map[c.oracle_id] = c;
    }
  };

  const clear = () => {
    for (const k of Object.keys(map)) {
      delete map[k];
    }
  };

  return (
    <ScryfallCacheContext.Provider value={{getCard, getCards, setCard, setCards, clear}}>
      {children}
    </ScryfallCacheContext.Provider>
  );
}

export function useScryfallCache() {
  const ctx = useContext(ScryfallCacheContext);
  if (!ctx) {
    throw new Error("useScryfallCache must be used within ScryfallCacheProvider");
  }
  return ctx;
}


