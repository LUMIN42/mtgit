import {z} from "zod";
import {protectedProcedure, router} from "../trpc.js";
import {getCollection} from "../db/mongo.js";
import {TRPCError} from "@trpc/server";
import {isDeepStrictEqual} from "node:util";


import {createEmptyRepositoryTemplate, ObjectIdSchema, RepositorySchema, FormatSchema, Repository} from "@mtgit/shared";
import {ObjectId} from "mongodb";
import {saveBranchSnapshot} from "../services/saveBranchSnapshot.js";


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
        deckName: z.string(),
        format: FormatSchema
      })
    )
    .mutation(async ({input, ctx}) => {
      const result = await getCollection("repositories").insertOne(
        createEmptyRepositoryTemplate(
          input.deckName,
          ctx.user._id,
          input.format
        )
      );

      return result.insertedId;
    }),

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
  }),

  update: protectedProcedure
    .input(RepositorySchema)
    .mutation(async ({ctx, input}) => {
      const reposCollection = getCollection("repositories");

      const originalRepoResult = await reposCollection.findOne({
        _id: new ObjectId(input._id)
      });

      if (!originalRepoResult) {
        throw new TRPCError({
          code: "NOT_FOUND"
        });
      }

      const originalRepo: Repository = RepositorySchema.parse(originalRepoResult);

      // ownership check
      if (originalRepo.owner_id !== ctx.user._id) {
        throw new TRPCError({
          code: "UNAUTHORIZED"
        });
      }

      // update document
      await reposCollection.replaceOne(
        {_id: originalRepoResult._id},
        {
          ...input,
          _id: originalRepoResult._id
        }
      );

      const updated = await reposCollection.findOne({
        _id: originalRepoResult._id
      });

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR"
        });
      }

      const updatedRepo = RepositorySchema.parse({
        ...updated,
        _id: updated._id.toString()
      });

      const updatedBranchNames = Object.entries(updatedRepo.branches)
        .filter(([branchName, branchContent]) =>
          !isDeepStrictEqual(branchContent, originalRepo.branches[branchName])
        )
        .map(([branchName]) => branchName);


      // todo double-check that it is fully parallelized
      const promises: Promise<void>[] = [];
      for (const updatedBranchName of updatedBranchNames) {
        const promise = saveBranchSnapshot(updatedRepo._id, updatedBranchName, updatedRepo.branches[updatedBranchName]);
        promises.push(promise);
      }

      for (const promise of promises) {
        await promise;
      }

      return updatedRepo;
    }),

  setTag: protectedProcedure
    .input(
      z.object({
        deckId: ObjectIdSchema,
        tagKey: z.string(),
        oracleId: z.string(),
        value: z.boolean()
      })
    )
    .mutation(async ({ctx, input}) => {
      const reposCollection = getCollection("repositories");

      const deck = await reposCollection.findOne({
        _id: new ObjectId(input.deckId)
      });

      if (!deck) {
        throw new TRPCError({code: "NOT_FOUND"});
      }

      if (deck.owner_id !== ctx.user._id) {
        throw new TRPCError({code: "UNAUTHORIZED"});
      }

      const fieldPath = `tags.${input.oracleId}`;

      if (input.value) {
        await reposCollection.updateOne(
          {_id: deck._id},
          {
            $addToSet: {
              [fieldPath]: input.tagKey
            }
          }
        );
      }
      else {
        await reposCollection.updateOne(
          {_id: deck._id},
          {
            $pull: {
              [fieldPath]: input.tagKey
            } as any
          }
        );
      }

      return {success: true};
    })
});