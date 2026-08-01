/**
 * Caches the cards' details such as name, mana value etc.
 * Handles bulk fetching.
 */

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
  OracleCard,
  OracleCardSchema
} from "@mtgit/shared/scryfall";

import {trpcRaw} from "../trpcClient.ts";

import {
  allDeckOracleIds,
  HydratedDeck,
  DeckCardCounts,
  TagsMap, CardCounts, HydratedDeckSection
} from "@mtgit/shared";

import {z} from "zod";

type PartiallyReconstructedDeckResult = {deck: HydratedDeck, isLoading: boolean};

type CardCacheValue = {
  usePartiallyReconstructedDeck: (
    cardCounts: DeckCardCounts,
    tags: TagsMap
  ) => PartiallyReconstructedDeckResult;

  fetchMissingDeckCards: (deckCardCounts: DeckCardCounts) => Promise<void>;

  tryGetCard: (oracleId: string) => OracleCard | undefined;

  buildPartiallyReconstructedDeck: (
    cardCounts: DeckCardCounts,
    tags: TagsMap
  ) => HydratedDeck;

  map: Record<string, OracleCard>;

  fetchMissingCards: (ids: string[]) => Promise<void>;

  partiallyReconstructedCounts: (cardCounts: CardCounts, tags: TagsMap) => HydratedDeckSection;

  isFetching: boolean;
};

const CardCacheContext =
  createContext<CardCacheValue | undefined>(undefined);

export function ScryfallCacheProvider({
  children
}: {
  children: ReactNode;
}) {
  const [map, setMap] = useState<
    Record<string, OracleCard>
  >({});

  const [isFetching, setIsFetching] = useState(false);

  const inflight = useRef<Set<string>>(new Set());

  const fetchMissingCards = useCallback(async (ids: string[]) => {
    ids = [...new Set(ids)];

    const missing = ids.filter(
      id => !map[id] && !inflight.current.has(id)
    );

    if (missing.length === 0) {
      return;
    }

    setIsFetching(true);

    missing.forEach(id => inflight.current.add(id));

    try {
      const result = await trpcRaw.cards.getMany.query({
        oracleIds: missing
      });

      const CardsMapSchema = z.record(
        z.string(),
        OracleCardSchema
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

      setIsFetching(false);
    }
  }, [map]);

  function partiallyReconstructedCounts(cardCounts: CardCounts, tags: TagsMap) {
    return Object.fromEntries(
      Object.entries(cardCounts)
        .filter(([oracleId, _]) => oracleId in map)
        .map(([oracleId, count]) => {
          return [oracleId, {
            ...map[oracleId],
            count,
            tags: tags[oracleId] ?? []
          }];
        })
    );
  }

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
  ): PartiallyReconstructedDeckResult => {
    const [isFetchingMissing, setIsFetchingMissing] = useState(false);

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
      if (missing.length === 0) {
        setIsFetchingMissing(false);
        return;
      }

      let cancelled = false;

      setIsFetchingMissing(true);

      fetchMissingCards(missing).finally(() => {
        if (!cancelled) {
          setIsFetchingMissing(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [missing]);

    const deck = useMemo(() => {
      return buildPartiallyReconstructedDeck(cardCounts, tags);
    }, [cardCounts, tags, map]);

    return {
      deck,
      isLoading: isFetchingMissing
    };
  };

  return (
    <CardCacheContext.Provider
      value={{
        usePartiallyReconstructedDeck,
        fetchMissingDeckCards,
        tryGetCard,
        buildPartiallyReconstructedDeck,
        map,
        fetchMissingCards: fetchMissingCards,
        partiallyReconstructedCounts,
        isFetching
      }}
    >
      {children}
    </CardCacheContext.Provider>
  );
}

/**
 * Caches the cards' details such as name, mana value etc.
 * Handles bulk fetching.
 */
export function useCardCache() {
  const ctx = useContext(CardCacheContext);
  if (!ctx) {
    throw new Error(
      "useCardCache must be used within ScryfallCacheProvider"
    );
  }
  return ctx;
}