import {
  CommanderGroupsInputSchema,
  CommanderGroupsOutputSchema,
  parseCardQuery,
  RecommendationSearchInputSchema,
  RecommendationSearchOutputSchema
} from "@mtgit/shared";
import {protectedProcedure, router} from "../trpc.js";
import {getCommanderGroups, getRecommendations} from "../services/recommendations.js";
import {filterOracleIds, listEligibleOracleIdsByEdhrec} from "../services/cardQuery/cardFiltering.js";

/**
 * Inputs and outputs are validated by the schemas in `@mtgit/shared`, an output not matching its schema
 * fails the request with INTERNAL_SERVER_ERROR instead of reaching the frontend.
 */
export const recommendationsRouter = router({
  /**
   * Paginated card recommendations for a deck, best first, filtered by a scryfall-like query.
   * Directives in the query (like `order:rec`) are ignored, unsupported parts are reported in `warnings`.
   * After the recommendations, every other eligible card (commander legal, within the commanders' identity) follows by EDHREC rank.
   * Mirrors the shape of a scryfall search page so the search screen can treat both alike.
   */
  search: protectedProcedure
    .input(RecommendationSearchInputSchema)
    .output(RecommendationSearchOutputSchema)
    .query(async ({input}) => {
      const {filter, warnings} = parseCardQuery(input.query);
      const recommendations = await getRecommendations(input.deck);
      const recommended = await filterOracleIds(recommendations.cards, filter);

      const start = (input.page - 1) * input.pageSize;
      const end = start + input.pageSize;

      // after the recommendations run out, continue with every other eligible card by EDHREC rank,
      // so niche queries whose cards no model knows still find something
      const commanders = Object.keys(input.deck.Commander ?? {});
      const exclude = new Set([
        ...recommendations.cards,
        ...Object.keys(input.deck.Main ?? {}),
        ...commanders
      ]);
      const others = await listEligibleOracleIdsByEdhrec(commanders, filter, exclude);

      const cards = [...recommended, ...others];
      const hasMore = end < cards.length;

      const noMatches = commanders.length > 0 && cards.length === 0;
      const fallbackNote = others.length > 0
        ? `${recommended.length} recommended cards, then other eligible cards by EDHREC rank.`
        : undefined;

      return {
        cards: cards.slice(start, end),
        totalCards: cards.length,
        recommendedCards: recommended.length,
        hasMore,
        nextPage: hasMore ? input.page + 1 : undefined,
        commanderName: recommendations.commanderName,
        message: recommendations.message ?? (noMatches ? "No eligible cards match the query." : undefined),
        warnings: fallbackNote ? [...warnings, fallbackNote] : warnings
      };
    }),

  /**
   * Card groups of the deck's commander: the sparse autoencoder neurons of its recommendation model
   * (`order:neurons`, `source: "neurons"`), or the clusters of its decks (`order:clustering`, `source: "clustering"`),
   * each with its cards, strongest first, filtered by a scryfall-like query.
   * Groups without any matching card are left out.
   */
  groups: protectedProcedure
    .input(CommanderGroupsInputSchema)
    .output(CommanderGroupsOutputSchema)
    .query(async ({input}) => {
      const {filter, warnings} = parseCardQuery(input.query);
      const result = await getCommanderGroups(input.deck, input.source);

      const allCards = [...new Set(result.groups.flatMap(group => group.cards.map(card => card.oracleId)))];
      const matching = new Set(await filterOracleIds(allCards, filter));

      const groups = result.groups
        .map(group => ({
          ...group,
          activeCards: group.cards.length,
          cards: group.cards.filter(card => matching.has(card.oracleId))
        }))
        .filter(group => group.cards.length > 0);

      const noMatches = result.groups.length > 0 && groups.length === 0;

      return {
        groups,
        commanderName: result.commanderName,
        modelDescription: result.modelDescription,
        message: result.message ?? (noMatches ? "No cards in the groups match the query." : undefined),
        warnings
      };
    })
});
