import {z} from "zod";
import {router, publicProcedure} from "../trpc.js";
import {getCollection} from "../db/mongo.js";
import {OracleCardSchema} from "@mtgit/shared";
import {TRPCError} from "@trpc/server";

const CardIdSchema = z.string();

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

      return OracleCardSchema.parse(raw);
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
      const cardsCollection = getCollection("scryfall_cards");

      const cardIds = [...new Set(input.cardIds)];

      console.log(cardIds);

      const rawCards = await cardsCollection
        .find({
          oracle_id: {$in: cardIds}
        })
        .toArray();

      const cards = z.array(OracleCardSchema).parse(rawCards);


      return Object.fromEntries(
        cards.map(
          card => [card.oracle_id, card]
        )
      );
    })
});