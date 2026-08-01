import {allRepositoryOracleIds, Repository} from "@mtgit/shared";
import {getCollection} from "../db/mongo.js";

/**
 * Returns the color identity of the entire repository for the case of checking commander legality.
 * Currently unused.
 */
export async function repositoryColors(repository: Repository) {
  const scryfallCardsCollection = getCollection("scryfall_cards");

  let oracleIds = allRepositoryOracleIds(repository);

  if (repository.format === "Commander") {
    oracleIds = new Set(Object.values(repository.branches)
      .flatMap(deck => Object.keys(deck.Commander ?? {})
      ));
  }

  const result = await scryfallCardsCollection.aggregate([
    {
      $match: {
        oracle_id: {
          $in: [...oracleIds] // set to array
        }
      }
    },
    {
      $unwind: "$color_identity"
    },
    {
      $group: {
        _id: null,
        colors: {
          $addToSet: "$color_identity"
        }
      }
    }
  ]).toArray();

  const colorIdentity: string[] = result[0]?.colors ?? [];

  return colorIdentity;
}