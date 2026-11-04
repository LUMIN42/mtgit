import {z} from "zod";
import {DeckCardCountsSchema} from "@mtgit/shared";
import {protectedProcedure, router} from "../trpc.js";
import {getRecommendations} from "../services/recommendations.js";

export const RECOMMENDATIONS_PAGE_SIZE = 175;

export const recommendationsRouter = router({
  /**
   * Paginated card recommendations for a deck, best first.
   * Mirrors the shape of a scryfall search page so the search screen can treat both alike.
   */
  search: protectedProcedure
    .input(
      z.object({
        deck: DeckCardCountsSchema,
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(1000).default(RECOMMENDATIONS_PAGE_SIZE)
      })
    )
    .query(async ({input}) => {
      const {cards, message, commanderName} = await getRecommendations(input.deck);

      const start = (input.page - 1) * input.pageSize;
      const end = start + input.pageSize;
      const hasMore = end < cards.length;

      return {
        cards: cards.slice(start, end),
        totalCards: cards.length,
        hasMore,
        nextPage: hasMore ? input.page + 1 : undefined,
        commanderName,
        message
      };
    })
});
