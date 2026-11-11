import type {DeckCardCounts} from "@mtgit/shared";
import {useQuery} from "@tanstack/react-query";
import {trpcRaw} from "../trpcClient.ts";
import {groupSource} from "./scryfallSearch.ts";

/**
 * Card groups of the deck's commander: neurons of its recommendation model for an `order:neurons` query, or clusters of the
 * commander's decks for an `order:clustering` query; the rest of the query filters the cards activating them.
 *
 * @param enabled whether the submitted query is an `order:neurons` or `order:clustering` query
 */
export function useCommanderGroups(query: string, deck: DeckCardCounts, enabled: boolean) {
  return useQuery({
    queryKey: ["card-groups", query, deck],
    queryFn: () => trpcRaw.recommendations.groups.query({deck, query, source: groupSource(query) ?? "neurons"}),
    enabled: enabled && query.length > 0
  });
}
