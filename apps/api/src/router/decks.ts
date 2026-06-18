import {z} from "zod";
import {protectedProcedure, router} from "../trpc.js";
import {getCollection} from "../db/mongo.js";
import {TRPCError} from "@trpc/server";

import {createEmptyRepositoryTemplate, ObjectIdSchema, RepositorySchema} from "@mtgit/shared";
import {ObjectId} from "mongodb";


export const decksRouter = router({
  get: protectedProcedure
    .input(
      z.object({
        deckId: ObjectIdSchema
      })
    )
    .query(async ({input, ctx}) => {
      const decksCollection = getCollection("repositories");

      const rawDeck = await decksCollection
        .findOne({_id: new ObjectId(input.deckId)});

      if (rawDeck === null) {
        throw new TRPCError({
          code: "NOT_FOUND"
        });
      }

      const deck = RepositorySchema.parse({
        ...rawDeck,
        _id: rawDeck._id.toString()
      });

      if (deck.owner_id !== ctx.user._id) {
        throw new TRPCError({
          code: "UNAUTHORIZED"
        });
      }

      return deck;
    }),

  create: protectedProcedure
    .input(
      z.object({
        deckName: z.string()
      })
    )
    .mutation(
      async ({input, ctx}) => {
        const result = await getCollection("repositories").insertOne(
          createEmptyRepositoryTemplate(input.deckName, ctx.user._id)
        );

        return result.insertedId;
      }
    ),

  usersDecks: protectedProcedure.query(async ({ctx}) => {
    const reposCollection = getCollection("repositories");

    const decks = await reposCollection
      .find({owner_id: ctx.user._id})
      .project({name: 1})
      .toArray();

    return decks.map(deck => ({
      _id: deck._id.toString(),
      name: deck.name
    }));
  })
});