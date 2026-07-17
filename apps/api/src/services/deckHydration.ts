import {allDeckOracleIds, DeckCardCounts, OracleCard, OracleCardSchema} from "@mtgit/shared";
import {getCollection} from "../db/mongo.js";
import {z} from "zod";

export async function createCardsMap(oracle_ids: string[]) {
  const cardsCollection = getCollection<OracleCard>("scryfall_cards");

  const cardsResponse = await cardsCollection.find({
    oracle_id: {$in: oracle_ids}
  }).toArray();

  const cards = z.array(OracleCardSchema).parse(cardsResponse);

  return Object.fromEntries(cards.map(card => [card.oracle_id, card]));
}

export async function hydrateDeck(cardAmounts: DeckCardCounts) {
  const ids = allDeckOracleIds(cardAmounts);

  const cardsMap = await createCardsMap(ids);

  return Object.fromEntries(
    Object.entries(cardAmounts)
      .map(
        ([sectionName, sectionContent]) => [sectionName,
          Object.fromEntries(
            Object.entries(sectionContent)
              .map(
                ([oracleId, count]) => [oracleId, {
                  ...cardsMap[oracleId],
                  count
                }]
              )
          )
        ]
      )
  );
}