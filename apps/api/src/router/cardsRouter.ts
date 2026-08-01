import {z} from "zod";
import {router, publicProcedure} from "../trpc.js";
import {getCollection} from "../db/mongo.js";
import {OracleCard, OracleCardSchema, OracleIdSchema} from "@mtgit/shared";
import {TRPCError} from "@trpc/server";

const CardIdSchema = z.string();

export const cardRouter = router({
  /**
   * hydrates an OracleId into an {@link OracleCard}.
   */
  get: publicProcedure
    .input(
      z.object({
        oracleId: CardIdSchema
      })
    )
    .query(async ({input}) => {
      const cards = getCollection("scryfall_cards");

      const raw = await cards.findOne({
        oracle_id: input.oracleId
      });

      if (!raw) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Card not found"
        });
      }

      return OracleCardSchema.parse(raw) as OracleCard;
    }),

  /**
   * Hydrate many cards from oracle ids to {@link OracleCard}s.
   *
   * @returns a record mapping oracle ids to {@link OracleCard}s
   */
  getMany: publicProcedure
    .input(
      z.object({
        oracleIds: z.array(OracleIdSchema).min(1).max(10000)
      })
    )
    .query(async ({input}) => {
      const cardsCollection = getCollection("scryfall_cards");

      const cardIds = [...new Set(input.oracleIds)];

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