import {z} from "zod";
import {
  ScryfallSearchResponseSchema,
  type ScryfallApiOracleCard
} from "./scryfall.js";
import {useState} from "react";
import {useInfiniteQuery} from "@tanstack/react-query";

export const ScryfallSearchQuerySchema = z.object({
  query: z.string(),
  limit: z.number().int().positive().max(100).default(20),
  skip: z.number().int().nonnegative().default(0)
});

const SCRYFALL_API_BASE_URL = "https://api.scryfall.com";

interface ScryfallSearchSuccess {
  ok: true;
  cards: ScryfallApiOracleCard[];
  totalCards: number;
  hasMore: boolean;
  message?: string;
  nextPageUrl?: string;
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
      nextPageUrl: parsed.data.next_page
    };
  }
  catch {
    return {
      ok: false,
      message: "Failed to fetch cards from Scryfall API."
    };
  }
}

export function useScryfallCardRetriever() {
  const [queryString, setQueryString] = useState("");


  const query = useInfiniteQuery({
    queryKey: ["scryfall-cards", queryString],

    queryFn: async ({pageParam}) => {
      return await fetchScryfallSearchPage(pageParam ?? buildSearchUrl(queryString, 1));
    },

    initialPageParam: null,

    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.ok) {
        return lastPage.nextPageUrl;
      }

      if (lastPage.ok) {
        return allPages.length + 1;
      }
      else {
        return undefined;
      }
    },

    enabled: queryString.length > 0
  });

  return {
    ids: query.data?.pages.flatMap(page => page.ok ? page.cards : []) ?? [],

    query: queryString,
    setQuery: setQueryString,

    ...query
  };
}