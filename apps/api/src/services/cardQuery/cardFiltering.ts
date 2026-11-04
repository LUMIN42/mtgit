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
