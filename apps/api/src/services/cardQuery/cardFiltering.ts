/**
 * Filters known cards by a parsed card query using the card database.
 */

import type {CardQuery, OracleId} from "@mtgit/shared";
import {getCollection} from "../../db/mongo.js";
import {toMongoCardFilter} from "./mongoCardQuery.js";

/**
 * @returns the oracle ids matching the query, in their original order.
 */
export async function filterOracleIds(oracleIds: OracleId[], query: CardQuery | null): Promise<OracleId[]> {
  if (query === null || oracleIds.length === 0) {
    return oracleIds;
  }

  const matchingDocuments = await getCollection("scryfall_cards")
    .find(
      {$and: [{oracle_id: {$in: oracleIds}}, toMongoCardFilter(query)]},
      {projection: {_id: 0, oracle_id: 1}}
    )
    .toArray();

  const matching = new Set(matchingDocuments.map(document => document.oracle_id as OracleId));

  return oracleIds.filter(id => matching.has(id));
}

/**
 * Lists every card a deck with the given commanders could play (commander legal, within their combined
 * color identity) matching the query, by EDHREC rank (unranked cards last, by name).
 * @param exclude cards to leave out, e.g. the deck's cards
 */
export async function listEligibleOracleIdsByEdhrec(
  commanders: OracleId[],
  query: CardQuery | null,
  exclude: ReadonlySet<OracleId>
): Promise<OracleId[]> {
  if (commanders.length === 0) {
    return [];
  }

  const collection = getCollection("scryfall_cards");

  const commanderDocuments = await collection
    .find({oracle_id: {$in: commanders}}, {projection: {_id: 0, color_identity: 1}})
    .toArray();
  const identity = [...new Set(commanderDocuments.flatMap(document => (document.color_identity ?? []) as string[]))];

  const documents = await collection
    .aggregate<{oracle_id: OracleId}>([
      {
        $match: {
          $and: [
            {"legalities.commander": "legal"},
            // no color outside the commanders' identity
            {color_identity: {$not: {$elemMatch: {$nin: identity}}}},
            ...(query === null ? [] : [toMongoCardFilter(query)])
          ]
        }
      },
      {
        $project: {
          _id: 0,
          oracle_id: 1,
          name: 1,
          rank: {$ifNull: ["$edhrec_rank", Number.MAX_SAFE_INTEGER]}
        }
      },
      {$sort: {rank: 1, name: 1}}
    ])
    .toArray();

  return documents
    .map(document => document.oracle_id)
    .filter(id => !exclude.has(id));
}
