import { z } from 'zod';
import {
  ScryfallSearchResponseSchema,
  type ScryfallApiOracleCard,
  type ScryfallOracleCard,
} from './scryfall.js';

export const ScryfallSearchQuerySchema = z.object({
  query: z.string(),
  limit: z.number().int().positive().max(100).default(20),
  skip: z.number().int().nonnegative().default(0),
});

const SCRYFALL_API_BASE_URL = 'https://api.scryfall.com';

interface ScryfallSearchSuccess {
  ok: true;
  cards: ScryfallApiOracleCard[];
  totalCards: number;
  hasMore: boolean;
  message?: string;
}

interface ScryfallSearchFailure {
  ok: false;
  message: string;
}

type ScryfallSearchPageResult = ScryfallSearchSuccess | ScryfallSearchFailure;

export interface ScryfallSearchResult {
  ok: boolean;
  message: string;
  cards: ScryfallOracleCard[];
  total: number;
}

function toOracleCards(cards: ScryfallApiOracleCard[]): ScryfallOracleCard[] {
  return cards as ScryfallOracleCard[];
}

function buildSearchUrl(query: string, page: number): URL {
  const url = new URL('/cards/search', SCRYFALL_API_BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  return url;
}

async function fetchScryfallSearchPage(query: string, page: number): Promise<ScryfallSearchPageResult> {
  try {
    const url = buildSearchUrl(query, page);
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    const payload: unknown = await response.json();
    const parsed = ScryfallSearchResponseSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Scryfall returned an unexpected response format.',
      };
    }

    if (parsed.data.object === 'error') {
      if (parsed.data.status === 404 || parsed.data.code === 'not_found') {
        return {
          ok: true,
          cards: [],
          totalCards: 0,
          hasMore: false,
          message: 'No cards found for the provided query.',
        };
      }

      return {
        ok: false,
        message: parsed.data.details,
      };
    }

    return {
      ok: true,
      cards: parsed.data.data,
      totalCards: parsed.data.total_cards,
      hasMore: parsed.data.has_more,
      message: parsed.data.warnings?.join(' '),
    };
  } catch {
    return {
      ok: false,
      message: 'Failed to fetch cards from Scryfall API.',
    };
  }
}

export async function searchScryfallCards(
  query: string,
  limit: number = 20,
  skip: number = 0,
): Promise<ScryfallSearchResult> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      ok: true,
      message: 'Found 0 card(s) matching the query.',
      cards: [],
      total: 0,
    };
  }

  const desiredEnd = skip + limit;
  let page = 1;
  let currentOffset = 0;
  let total = 0;
  let collectedCards: ScryfallApiOracleCard[] = [];

  while (currentOffset < desiredEnd) {
    const pageResult = await fetchScryfallSearchPage(trimmedQuery, page);

    if (!pageResult.ok) {
      return {
        ok: false,
        message: pageResult.message,
        cards: [],
        total: 0,
      };
    }

    const pageCards = pageResult.cards;
    total = pageResult.totalCards;

    if (pageCards.length === 0) {
      break;
    }

    const pageStart = currentOffset;
    const pageEnd = currentOffset + pageCards.length;

    if (skip < pageEnd && desiredEnd > pageStart) {
      const startInPage = Math.max(0, skip - pageStart);
      const endInPage = Math.min(pageCards.length, desiredEnd - pageStart);
      collectedCards = collectedCards.concat(pageCards.slice(startInPage, endInPage));
    }

    if (!pageResult.hasMore) {
      break;
    }

    currentOffset = pageEnd;
    page += 1;
  }

  const cards = toOracleCards(collectedCards);

  return {
    ok: true,
    message: `Found ${cards.length} card(s) matching the query.`,
    cards,
    total,
  };
}
