import {
  createContext,
  useContext,
  useState,
  useRef
} from "react";
import type {ReactNode} from "react";
import {ScryfallOracleCard, ScryfallOracleCardSchema} from "@mtgit/shared/scryfall";
import {trpcClient} from "../trpcClient.ts";

type ScryfallCacheValue = {
  getCard: (oracleId: string) => Promise<ScryfallOracleCard | undefined>;
  getCards: (oracleIds: string[]) => Promise<(ScryfallOracleCard | undefined)[]>;
  clear: () => void;
};

const ScryfallCacheContext =
  createContext<ScryfallCacheValue | undefined>(undefined);

export function ScryfallCacheProvider({
  children
}: {
  children: ReactNode;
}) {
  const [map, setMap] = useState<
    Record<string, ScryfallOracleCard>
  >({});

  const inflight = useRef<Set<string>>(new Set());

  const setCard = (card: ScryfallOracleCard) => {
    setMap(prev => ({
      ...prev,
      [card.oracle_id]: card
    }));
  };

  const setCards = (cards: ScryfallOracleCard[]) => {
    setMap(prev => {
      const next = {...prev};
      for (const c of cards) {
        next[c.oracle_id] = c;
      }
      return next;
    });
  };

  const clear = () => {
    setMap({});
  };

  /**
   * 🔥 single card with cache + fallback fetch
   */
  const getCard = async (id: string): Promise<ScryfallOracleCard> => {
    const cached = map[id];
    if (cached) {
      return cached;
    }

    if (inflight.current.has(id)) {
      return undefined;
    }

    inflight.current.add(id);

    try {
      const res = await trpcClient.cards.get.query({cardId: id});

      const parsed = ScryfallOracleCardSchema.parse(res);

      setCard(parsed);
      return parsed;
    }
    catch (err) {
      console.error("Failed to fetch or validate card:", err);
      return undefined;
    }
    finally {
      inflight.current.delete(id);
    }
  };

  /**
   * 🔥 bulk fetch with partial cache hit
   */
  const getCards = async (ids: string[]) => {
    const result: (ScryfallOracleCard | undefined)[] = [];
    const missing: string[] = [];

    for (const id of ids) {
      const cached = map[id];
      if (cached) {
        result.push(cached);
      }
      else {
        result.push(undefined);
        missing.push(id);
      }
    }

    if (missing.length > 0) {
      const fetched = await trpcClient.cards.getMany.query({
        cardIds: missing
      });

      // 🔒 validate every returned card
      const parsed = fetched
        .map(c => ScryfallOracleCardSchema.safeParse(c))
        .filter(r => {
          if (!r.success) {
            console.warn("Invalid card from API:", r.error);
            return false;
          }
          return true;
        })
        .map(r => r.data);

      setCards(parsed);

      const fetchedMap = new Map(
        parsed.map(c => [c.oracle_id, c])
      );

      return ids.map(id => map[id] ?? fetchedMap.get(id));
    }

    return result;
  };

  return (
    <ScryfallCacheContext.Provider
      value={{
        getCard,
        getCards,
        clear
      }}
    >
      {children}
    </ScryfallCacheContext.Provider>
  );
}

export function useScryfallCache() {
  const ctx = useContext(ScryfallCacheContext);
  if (!ctx) {
    throw new Error(
      "useScryfallCache must be used within ScryfallCacheProvider"
    );
  }
  return ctx;
}