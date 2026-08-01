import {z} from "zod";
import {protectedProcedure, router} from "../trpc.js";
import {getCollection} from "../db/mongo.js";
import {TRPCError} from "@trpc/server";
import {isDeepStrictEqual} from "node:util";


import {
  BranchSnapshot,
  BranchSnapshotSchema,
  createEmptyRepositoryTemplate,
  FormatSchema,
  ObjectIdSchema,
  Repository,
  RepositorySchema
} from "@mtgit/shared";
import {ObjectId} from "mongodb";
import {saveBranchSnapshot} from "../services/saveBranchSnapshot.js";
import {DbRepository, DbRepositorySchema, DbBranchSnapshot, DbBranchSnapshotSchema} from "../dbTypes.js";


export const decksRouter = router({
  /**
   * Returns the whole repository with a given id.
   *
   * @throws TRPCError if deck is not found. If unauthorized, not found is returned as well
   * in order to hide the information of existence of a deck with a given id for privacy’s sake.
   */
  get: protectedProcedure
    .input(
      z.object({
        deckId: ObjectIdSchema
      })
    )
    .query(async ({input, ctx}) => {
      const decksCollection = getCollection<DbRepository>("repositories");

      const rawDeck = await decksCollection
        .findOne({
          _id: new ObjectId(input.deckId),
          owner_id: ctx.user._id
        });

      if (rawDeck === null) {
        throw new TRPCError({
          code: "NOT_FOUND"
        });
      }

      return RepositorySchema.parse({
        ...rawDeck,
        _id: rawDeck._id.toString()
      });
    }),

  /**
   * Writes directly to DB.
   *
   * @returns id of the created deck repository.
   */
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

  /**
   * Returns the ids and names of all the decks the user owns.
   * Used in deck selection screen.
   */
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
        const promise = saveBranchSnapshot(updatedRepo._id,
          updatedBranchName,
          updatedRepo.branches[updatedBranchName]);
        promises.push(promise);
      }

      for (const promise of promises) {
        await promise;
      }

      return updatedRepo;
    }),

  /**
   * Sets or unsets a single tag of a card in a deck.
   * Allows for creating new tags as well.
   */
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
    }),

  /**
   * Returns all the branch snapshots of the given branch.
   *
   * @returns a list of {@link BranchSnapshot} objects
   */
  branchHistory: protectedProcedure
    .input(z.object({
      repositoryId: ObjectIdSchema,
      branchName: z.string()
      // todo batching
    }))
    .output(
      z.array(BranchSnapshotSchema)
    )
    .query(async ({ctx, input: {branchName, repositoryId}}) => {
      const reposCollection = getCollection("repositories");

      const repoFilter: Partial<DbRepository> =
        {
          _id: new ObjectId(repositoryId),
          owner_id: ctx.user._id
        };

      const rawRepo = await reposCollection.findOne(repoFilter);

      if (!rawRepo) {
        throw new TRPCError({code: "NOT_FOUND", message: "Repo not found."});
      }

      const repo = DbRepositorySchema.parse(rawRepo);

      if (!(branchName in repo.branches)) {
        throw new TRPCError({code: "NOT_FOUND", message: "Branch not found."});
      }

      const snapshotsCollection = getCollection<DbBranchSnapshot>("branch_snapshots");


      const rawSnapshots = await snapshotsCollection
        .find({
          branchName,
          deckId: repositoryId
        })
        .sort({"snapshot.timestamp": -1})
        .toArray();

      const snapshotsSchema = z.array(DbBranchSnapshotSchema);

      const dbSnapshots = snapshotsSchema.parse(rawSnapshots);
      const snapshots: BranchSnapshot[] = dbSnapshots.map(
        snapshot => snapshot.snapshot
      );

      return snapshots;
    }),

  /**
  * Returns a single branch snapshot based on its id if the user has rights for that.
  */ 
  branchSnapshot: protectedProcedure
    .input(z.object({
      repositoryId: ObjectIdSchema,
      snapshotId: ObjectIdSchema
    }))
    .output(BranchSnapshotSchema)
    .query(async ({ctx, input: {repositoryId, snapshotId}}) => {
      const reposCollection = getCollection("repositories");
      const snapshotsCollection = getCollection<DbBranchSnapshot>("branch_snapshots");

      const repoFilter: Partial<DbRepository> = {
        _id: new ObjectId(repositoryId),
        owner_id: ctx.user._id
      };

      const rawRepo = await reposCollection.findOne(repoFilter);

      if (!rawRepo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repo not found."
        });
      }

      const rawSnapshot = await snapshotsCollection.findOne({
        _id: new ObjectId(snapshotId),
        deckId: repositoryId
      });


      if (!rawSnapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found."
        });
      }

      const dbSnapshot = DbBranchSnapshotSchema.parse(rawSnapshot);

      return dbSnapshot.snapshot;
    }),

  /**
  * Deletes an entire deck repository from the DB.
  * Returns NOT_FOUND code in place of unauthorized in order to not allow people to check which ids are taken.
  */
  delete: protectedProcedure
    .input(z.object({deckId: ObjectIdSchema}))
    .mutation(async ({ctx, input: {deckId}}) => {
      const reposCollection = getCollection<DbRepository>("repositories");


      const result = await reposCollection.deleteOne({
        _id: new ObjectId(deckId),
        owner_id: ctx.user._id
      });

      if (result.deletedCount === 0) {
        throw new TRPCError({code: "NOT_FOUND", message: "Could not find a repository owned by you with the given id"});
      }

      await getCollection<DbBranchSnapshot>("branch_snapshots").deleteMany({deckId});
    })
});