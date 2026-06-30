import {
  createContext,
  useContext,
  useState
} from "react";
import type {ReactNode} from "react";
import {ScryfallOracleCard, ScryfallOracleCardSchema} from "@mtgit/shared/scryfall";
import {trpcClient} from "../trpcClient.ts";
import {allDeckOracleIds, HydratedDeck, DeckCardCounts, TagsMap} from "@mtgit/shared";
import {z} from "zod";

type ScryfallCacheValue = {
  // getCard: (oracleId: string) => Promise<ScryfallOracleCard | undefined>;
  // getCards: (oracleIds: string[]) => Promise<(ScryfallOracleCard | undefined)[]>;
  // clear: () => void;
  partiallyReconstructedDeck: (cardCounts: DeckCardCounts, tags: TagsMap) => HydratedDeck;
  fetchMissingDeckCards: (deckCardCounts: DeckCardCounts) => Promise<void>;
  tryGetCard: (oracleId: string) => ScryfallOracleCard | undefined;
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

  const [fetchingCards, setFetchingCards] = useState<Set<string>>(new Set());


  // const getCard = async (id: string): Promise<ScryfallOracleCard> => {
  //   const cached = map[id];
  //   if (cached) {
  //     return cached;
  //   }
  //
  //   if (inflight.current.has(id)) {
  //     return undefined;
  //   }
  //
  //   inflight.current.add(id);
  //
  //   try {
  //     const res = await trpcClient.cards.get.query({cardId: id});
  //
  //     const parsed = ScryfallOracleCardSchema.parse(res);
  //
  //     fetchCard(parsed);
  //     return parsed;
  //   }
  //   catch (err) {
  //     console.error("Failed to fetch or validate card:", err);
  //     return undefined;
  //   }
  //   finally {
  //     inflight.current.delete(id);
  //   }
  // };

  const fetchMissingCards = async (ids: string[]): Promise<void> => {
    const missing = ids.filter(id => !map[id] && !fetchingCards.has(id));

    if (missing.length === 0) {
      return;
    }

    setFetchingCards(prev => new Set([...prev, ...missing]));

    const result = await trpcClient.cards.getMany.query({
      cardIds: missing
    });

    const cards = z.array(ScryfallOracleCardSchema).parse(result);

    const newMap = Object.fromEntries(
      cards.map(card => [card.oracle_id, card])
    );

    setMap(prev => ({
      ...prev,
      ...newMap
    }));
  };

  const fetchMissingDeckCards = async (deckCardCounts: DeckCardCounts) => {
    await fetchMissingCards(allDeckOracleIds(deckCardCounts));
  };


  // const getCards = async (ids: string[]) => {
  //   const result: (ScryfallOracleCard | undefined)[] = [];
  //   const missing: string[] = [];
  //
  //   for (const id of ids) {
  //     const cached = map[id];
  //     if (cached) {
  //       result.push(cached);
  //     }
  //     else {
  //       result.push(undefined);
  //       missing.push(id);
  //     }
  //   }
  //
  //   if (missing.length > 0) {
  //     const fetched = await trpcClient.cards.getMany.query({
  //       cardIds: missing
  //     });
  //
  //     // 🔒 validate every returned card
  //     const parsed = fetched
  //       .map(c => ScryfallOracleCardSchema.safeParse(c))
  //       .filter(r => {
  //         if (!r.success) {
  //           console.warn("Invalid card from API:", r.error);
  //           return false;
  //         }
  //         return true;
  //       })
  //       .map(r => r.data);
  //
  //     fetchMissingCards(parsed);
  //
  //     const fetchedMap = new Map(
  //       parsed.map(c => [c.oracle_id, c])
  //     );
  //
  //     return ids.map(id => map[id] ?? fetchedMap.get(id));
  //   }
  //
  //   return result;
  // };

  const partiallyReconstructedDeck = (cardCounts: DeckCardCounts, tags: TagsMap) => {
    const result: HydratedDeck = {};

    for (const sectionName in cardCounts) {
      result[sectionName] ??= {};

      for (const oracleId in cardCounts[sectionName]) {
        const cardCount = cardCounts[sectionName][oracleId];
        if (oracleId in map) {
          result[sectionName][oracleId] = {
            ...map[oracleId],
            count: cardCount,
            tags: tags[oracleId] ?? []
          };
        }
      }
    }

    return result;
  };

  const tryGetCard = (oracleId: string) => map[oracleId];


  // const hydratedDeck = async (cardCounts: DeckCardCounts, tags: TagsMap) => {
  //   const result = Deck.empty();
  //
  //   const cardLookupTable = fetchMissingCards(allDeckOracleIds(cardCounts));
  //
  //   for (const sectionName in cardCounts) {
  //     for (const oracleId in cardCounts[sectionName]) {
  //       const cardCount = cardCounts[sectionName][oracleId];
  //
  //       result.sections[sectionName][oracleId] = {
  //         ...cardLookupTable[oracleId],
  //         count: cardCount,
  //         tags: tags[oracleId] ?? []
  //       };
  //     }
  //   }
  //
  //   return result;
  // };

  return (
    <ScryfallCacheContext.Provider
      value={{
        fetchMissingDeckCards,
        // hydratedDeck,
        partiallyReconstructedDeck,
        tryGetCard
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