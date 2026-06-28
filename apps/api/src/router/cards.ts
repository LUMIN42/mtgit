import {z} from "zod";
import {router, publicProcedure} from "../trpc.js";
import {getCollection} from "../db/mongo.js";
import {ScryfallOracleCard, ScryfallOracleCardSchema} from "@mtgit/shared";
import {TRPCError} from "@trpc/server";

const CardIdSchema = z.string();

/**
 * Internal helper: normalize + validate Mongo document
 */
function parseCard(raw: unknown):ScryfallOracleCard {
  return ScryfallOracleCardSchema.parse(raw);
}

export const cardRouter = router({
  /**
   * 🧩 Fetch a single card by oracle_id
   */
  get: publicProcedure
    .input(
      z.object({
        cardId: CardIdSchema // <- oracle_id
      })
    )
    .query(async ({input}) => {
      const cards = getCollection("scryfall_cards");

      const raw = await cards.findOne({
        oracle_id: input.cardId
      });

      if (!raw) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Card not found"
        });
      }

      return parseCard(raw);
    }),

  /**
   * 📦 Fetch many cards by oracle_id
   */
  getMany: publicProcedure
    .input(
      z.object({
        cardIds: z.array(CardIdSchema).min(1).max(10000)
      })
    )
    .query(async ({input}) => {
      const cards = getCollection("scryfall_cards");

      const rawCards = await cards
        .find({
          oracle_id: {$in: input.cardIds}
        })
        .toArray();

      return rawCards.map(parseCard);
    })
});