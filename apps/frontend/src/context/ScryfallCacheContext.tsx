import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from "react";
import type {ReactNode} from "react";

import {
  ScryfallOracleCard,
  ScryfallOracleCardSchema
} from "@mtgit/shared/scryfall";

import {trpcClient} from "../trpcClient.ts";

import {
  allDeckOracleIds,
  HydratedDeck,
  DeckCardCounts,
  TagsMap
} from "@mtgit/shared";

import {z} from "zod";

type ScryfallCacheValue = {
  usePartiallyReconstructedDeck: (
    cardCounts: DeckCardCounts,
    tags: TagsMap
  ) => HydratedDeck;

  fetchMissingDeckCards: (deckCardCounts: DeckCardCounts) => Promise<void>;

  tryGetCard: (oracleId: string) => ScryfallOracleCard | undefined;

  buildPartiallyReconstructedDeck: (
    cardCounts: DeckCardCounts,
    tags: TagsMap
  ) => HydratedDeck;

  map: Record<string, ScryfallOracleCard>;
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

  /**
   * IMPORTANT:
   * useRef instead of useState for in-flight tracking
   * (state is too slow + causes race conditions)
   */
  const inflight = useRef<Set<string>>(new Set());

  const fetchMissingCards = useCallback(async (ids: string[]) => {
    const missing = ids.filter(
      id => !map[id] && !inflight.current.has(id)
    );

    if (missing.length === 0) {
      return;
    }

    missing.forEach(id => inflight.current.add(id));

    try {
      const result = await trpcClient.cards.getMany.query({
        cardIds: missing
      });

      const CardsMapSchema = z.record(
        z.string(),
        ScryfallOracleCardSchema
      );

      setMap(prev => ({
        ...prev,
        ...CardsMapSchema.parse(result)
      }));
    }
    finally {
      missing.forEach(id =>
        inflight.current.delete(id)
      );
    }
  }, [map]);

  const fetchMissingDeckCards = useCallback(
    (deckCardCounts: DeckCardCounts) => {
      return fetchMissingCards(
        allDeckOracleIds(deckCardCounts)
      );
    },
    [fetchMissingCards]
  );

  const tryGetCard = useCallback(
    (oracleId: string) => map[oracleId],
    [map]
  );

  function buildPartiallyReconstructedDeck(
    cardCounts: DeckCardCounts,
    tags: TagsMap
  ): HydratedDeck {
    const result: HydratedDeck = {};

    for (const section in cardCounts) {
      result[section] = {};

      for (const id in cardCounts[section]) {
        const card = map[id];
        if (!card) continue;

        result[section][id] = {
          ...card,
          count: cardCounts[section][id],
          tags: tags[id] ?? []
        };
      }
    }

    return result;
  }

  /**
   * Hook: derive hydrated deck + trigger fetching
   */
  const usePartiallyReconstructedDeck = (
    cardCounts: DeckCardCounts,
    tags: TagsMap
  ): HydratedDeck => {
    const missing = useMemo(() => {
      const ids: string[] = [];

      for (const section in cardCounts) {
        for (const id in cardCounts[section]) {
          if (!map[id]) {
            ids.push(id);
          }
        }
      }

      return ids;
    }, [cardCounts, map]);

    useEffect(() => {
      if (missing.length > 0) {
        void fetchMissingCards(missing);
      }
    }, [missing]);

    return useMemo(() => {
      return buildPartiallyReconstructedDeck(cardCounts, tags);
    }, [cardCounts, tags, map]);
  };

  return (
    <ScryfallCacheContext.Provider
      value={{
        usePartiallyReconstructedDeck,
        fetchMissingDeckCards,
        tryGetCard,
        buildPartiallyReconstructedDeck,
        map
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