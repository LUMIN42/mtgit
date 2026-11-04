import {z} from "zod";
import {DeckCardCountsSchema, parseCardQuery} from "@mtgit/shared";
import {protectedProcedure, router} from "../trpc.js";
import {getRecommendations} from "../services/recommendations.js";
import {filterOracleIds} from "../services/cardQuery/cardFiltering.js";

export const RECOMMENDATIONS_PAGE_SIZE = 175;

export const recommendationsRouter = router({
  /**
   * Paginated card recommendations for a deck, best first, filtered by a scryfall-like query.
   * Directives in the query (like `order:rec`) are ignored, unsupported parts are reported in `warnings`.
   * Mirrors the shape of a scryfall search page so the search screen can treat both alike.
   */
  search: protectedProcedure
    .input(
      z.object({
        deck: DeckCardCountsSchema,
        query: z.string().max(1000).default(""),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(1000).default(RECOMMENDATIONS_PAGE_SIZE)
      })
    )
    .query(async ({input}) => {
      const {filter, warnings} = parseCardQuery(input.query);
      const recommendations = await getRecommendations(input.deck);
      const cards = await filterOracleIds(recommendations.cards, filter);

      const start = (input.page - 1) * input.pageSize;
      const end = start + input.pageSize;
      const hasMore = end < cards.length;

      const noMatches = recommendations.cards.length > 0 && cards.length === 0;

      return {
        cards: cards.slice(start, end),
        totalCards: cards.length,
        hasMore,
        nextPage: hasMore ? input.page + 1 : undefined,
        commanderName: recommendations.commanderName,
        message: recommendations.message ?? (noMatches ? "No recommended cards match the query." : undefined),
        warnings
      };
    })
});
