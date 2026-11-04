/**
 * Client for the card recommendation API (the dockerized Flask EASE service, see `mtgit recsys/api`).
 *
 * The recommendation API returns every recommendable card at once,
 * so the full ranking is cached here and served in pages.
 */

import {z} from "zod";
import {TRPCError} from "@trpc/server";
import type {DeckCardCounts, OracleId} from "@mtgit/shared";

const RECSYS_API_URL = (process.env.RECSYS_API_URL ?? "http://127.0.0.1:5000").replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 60_000;
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX_ENTRIES = 50;

const RecommendResponseSchema = z.object({
  commander: z.object({
    oracle_id: z.string(),
    name: z.string(),
    decks: z.number()
  }),
  additions: z.array(z.object({
    oracle_id: z.string(),
    score: z.number()
  }))
});

const RecsysErrorSchema = z.object({
  error: z.string()
});

export interface Recommendations {
  /** Oracle ids, best first. */
  cards: OracleId[];
  commanderName?: string;
  message?: string;
}

type CacheEntry = {
  expiresAt: number;
  value: Promise<Recommendations>;
};

const cache = new Map<string, CacheEntry>();

function cacheKey(commanders: OracleId[], deck: Record<OracleId, number>): string {
  return JSON.stringify([commanders, Object.keys(deck).sort()]);
}

async function readRecsysError(response: Response): Promise<string> {
  try {
    const parsed = RecsysErrorSchema.safeParse(await response.json());
    if (parsed.success) {
      return parsed.data.error;
    }
  }
  catch {
    // fall through
  }
  return `Recommendation API responded with status ${response.status}.`;
}

type RecsysResult =
  | {status: "ok", data: z.infer<typeof RecommendResponseSchema>}
  | {status: "no-model" | "no-overlap", message: string};

async function requestRecommendations(
  commander: OracleId,
  deck: Record<OracleId, number>
): Promise<RecsysResult> {
  let response: Response;

  try {
    response = await fetch(`${RECSYS_API_URL}/recommend`, {
      method: "POST",
      headers: {"Content-Type": "application/json", Accept: "application/json"},
      body: JSON.stringify({commander, deck}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  }
  catch (error) {
    console.error("Recommendation API unreachable", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The recommendation service is unreachable."
    });
  }

  if (response.status === 404) {
    return {status: "no-model", message: await readRecsysError(response)};
  }

  if (response.status === 422) {
    return {status: "no-overlap", message: await readRecsysError(response)};
  }

  if (!response.ok) {
    const message = await readRecsysError(response);
    console.error("Recommendation API error", response.status, message);
    throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message});
  }

  const parsed = RecommendResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    console.error(parsed.error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The recommendation service returned an unexpected response format."
    });
  }

  return {status: "ok", data: parsed.data};
}

/**
 * Tries the deck's commanders in order (partners have separate models) and uses the first one with a model.
 */
async function computeRecommendations(
  commanders: OracleId[],
  deck: Record<OracleId, number>
): Promise<Recommendations> {
  const messages: string[] = [];

  for (const commander of commanders) {
    const result = await requestRecommendations(commander, deck);

    if (result.status === "ok") {
      const deckCards = new Set(Object.keys(deck));

      return {
        // the other partner is in the deck, but not necessarily known to this commander's model as a deck card
        cards: result.data.additions
          .map(card => card.oracle_id)
          .filter(id => !deckCards.has(id)),
        commanderName: result.data.commander.name
      };
    }

    messages.push(result.message);
  }

  return {cards: [], message: messages.join(" ")};
}

/**
 * @returns the full recommendation ranking for a deck, cached for a few minutes.
 */
export function getRecommendations(deckCounts: DeckCardCounts): Promise<Recommendations> {
  const commanders = Object.keys(deckCounts.Commander ?? {});

  if (commanders.length === 0) {
    return Promise.resolve({
      cards: [],
      message: "Recommendations need a commander. Add one to the deck's Commander section."
    });
  }

  const deck: Record<OracleId, number> = {
    ...deckCounts.Main,
    ...deckCounts.Commander
  };

  const key = cacheKey(commanders, deck);
  const now = Date.now();

  for (const [entryKey, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(entryKey);
    }
  }

  const cached = cache.get(key);
  if (cached) {
    return cached.value;
  }

  const value = computeRecommendations(commanders, deck);
  // failed requests are not cached, so retrying works once the service is back
  value.catch(() => cache.delete(key));

  cache.set(key, {expiresAt: now + CACHE_TTL_MS, value});

  while (cache.size > CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value!);
  }

  return value;
}
