import {
  GroupSourceSchema,
  parseCardQuery,
  ScryfallSearchResponseSchema,
  type DeckCardCounts,
  type GroupSource,
  type ScryfallApiOracleCard
} from "@mtgit/shared";
import {useMemo, useState} from "react";
import {InfiniteData, useInfiniteQuery} from "@tanstack/react-query";
import {trpcRaw} from "../trpcClient.ts";

/**
 * `order:rec` makes the search list recommendations for the deck instead of querying scryfall,
 * the rest of the query then filters the recommendations.
 */
export function isRecommendationQuery(query: string): boolean {
  return parseCardQuery(query).directives.order === "rec";
}

/**
 * `order:neurons` shows the neurons of the commander's recommendation model with the cards activating them,
 * `order:clustering` the clusters of the commander's decks with their most distinctive cards, shown the same way;
 * the rest of the query then filters those cards.
 */
export function isGroupQuery(query: string): boolean {
  return groupSource(query) !== undefined;
}

/**
 * @returns which group view an `order:neurons` or `order:clustering` query asks for, undefined for other queries
 */
export function groupSource(query: string): GroupSource | undefined {
  const parsed = GroupSourceSchema.safeParse(parseCardQuery(query).directives.order);
  return parsed.success ? parsed.data : undefined;
}

/**
 * @returns whether the query's results are computed from the deck (its commander), see {@link isRecommendationQuery}
 */
export function isDeckDependentQuery(query: string): boolean {
  return isRecommendationQuery(query) || isGroupQuery(query);
}

const SCRYFALL_API_BASE_URL = "https://api.scryfall.com";

interface ScryfallSearchSuccess {
  ok: true;
  cards: ScryfallApiOracleCard[];
  totalCards: number;
  hasMore: boolean;
  message?: string;
  /** scryfall url of the next page, or the next page number for recommendations */
  nextPage?: string | number;
}

interface ScryfallSearchFailure {
  ok: false;
  message: string;
}

type ScryfallSearchPageResult = ScryfallSearchSuccess | ScryfallSearchFailure;

function buildSearchUrl(query: string, page: number): string {
  const url = new URL("/cards/search", SCRYFALL_API_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("page", String(page));
  return url.toString();
}

async function fetchScryfallSearchPage(url: string): Promise<ScryfallSearchPageResult> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    const payload: unknown = await response.json();
    const parsed = ScryfallSearchResponseSchema.safeParse(payload);

    if (!parsed.success) {
      console.error(parsed.error);

      return {
        ok: false,
        message: "Scryfall returned an unexpected response format."
      };
    }

    if (parsed.data.object === "error") {
      if (parsed.data.status === 404 || parsed.data.code === "not_found") {
        return {
          ok: true,
          cards: [],
          totalCards: 0,
          hasMore: false,
          message: "No cards found for the provided query."
        };
      }

      return {
        ok: false,
        message: parsed.data.details
      };
    }

    return {
      ok: true,
      cards: parsed.data.data,
      totalCards: parsed.data.total_cards,
      hasMore: parsed.data.has_more,
      message: parsed.data.warnings?.join(" "),
      nextPage: parsed.data.next_page
    };
  }
  catch {
    return {
      ok: false,
      message: "Failed to fetch cards from Scryfall API."
    };
  }
}

async function fetchRecommendationPage(
  deck: DeckCardCounts,
  query: string,
  page: number
): Promise<ScryfallSearchPageResult> {
  try {
    const result = await trpcRaw.recommendations.search.query({deck, query, page});

    // every page repeats the same notes, show them only once
    const notes = page === 1
      ? [
        result.message ?? (result.commanderName ? `Recommendations for ${result.commanderName}.` : undefined),
        ...result.warnings
      ]
      : [];

    return {
      ok: true,
      cards: result.cards,
      totalCards: result.totalCards,
      hasMore: result.hasMore,
      message: notes.filter(note => note !== undefined).join(" ") || undefined,
      nextPage: result.nextPage
    };
  }
  catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to fetch recommendations."
    };
  }
}

interface SubmittedSearch {
  query: string;
  /** deck the recommendations are computed for, frozen at submission so adding a card does not reshuffle the results */
  deck: DeckCardCounts;
}

/**
 * Infinite scryfall search. Queries containing `order:rec` are served by the recommendation backend instead,
 * `order:neurons` queries are not fetched here, see `useCommanderGroups`.
 */
export function useScryfallCardRetriever() {
  const [submitted, setSubmitted] = useState<SubmittedSearch>({query: "", deck: {}});

  const queryString = submitted.query;
  const isRecommendation = isRecommendationQuery(queryString);
  // served by useCommanderGroups instead
  const isGroups = isGroupQuery(queryString);

  const query = useInfiniteQuery<
    ScryfallSearchPageResult,
    Error,
    InfiniteData<ScryfallSearchPageResult>,
    unknown[],
    string | number | null
  >({
    queryKey: isRecommendation
      ? ["card-recommendations", queryString, submitted.deck]
      : ["scryfall-cards", queryString],

    queryFn: async ({pageParam}) => {
      if (isRecommendation) {
        return await fetchRecommendationPage(
          submitted.deck,
          queryString,
          typeof pageParam === "number" ? pageParam : 1
        );
      }

      return await fetchScryfallSearchPage(typeof pageParam === "string" ? pageParam : buildSearchUrl(queryString, 1));
    },

    initialPageParam: null,

    getNextPageParam: (lastPage) => {
      if (lastPage.ok) {
        return lastPage.nextPage;
      }
      else {
        return undefined;
      }
    },

    enabled: queryString.length > 0 && !isGroups
  });

  // memoized, so consumers re-render the result grid only when a page actually arrives
  const ids = useMemo(
    () => query.data?.pages.flatMap(page => page.ok ? page.cards : []) ?? [],
    [query.data]
  );

  const messages = useMemo(
    () => query.data?.pages.flatMap(page => page.message ? [page.message] : []) ?? [],
    [query.data]
  );

  return {
    ids,

    query: queryString,
    /** deck the submitted query was made for */
    deck: submitted.deck,
    /**
     * @param deck needed only for `order:rec` and `order:neurons` queries
     */
    setQuery: (query: string, deck: DeckCardCounts = {}) => setSubmitted({query, deck}),
    isRecommendation,
    isGroups,
    messages,

    ...query
  };
}