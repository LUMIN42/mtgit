import {z} from "zod";
import {router, protectedProcedure} from "../trpc.js";
import {
  ObjectIdSchema,
  RepositoryPreferencesSchema
} from "@mtgit/shared";
import {getCollection} from "../db/mongo.js";
import {DbRepositoryPreferences, DbRepositoryPreferencesSchema} from "../dbTypes.js";
import {TRPCError} from "@trpc/server";
import {ObjectId} from "mongodb";

export const repositoryPreferencesRouter = router({
  // Fetch current user's preferences
  get: protectedProcedure
    .input(z.object({
      repositoryId: ObjectIdSchema
    }))
    .query(async ({ctx, input: {repositoryId}}) => {
      const preferencesCollection = getCollection<DbRepositoryPreferences>("repository_preferences");

      const userId = ctx.user._id;


      const repositoriesCollection = getCollection("repositories");
      const response = await repositoriesCollection.findOne(
        {
          _id: new ObjectId(repositoryId),
          owner_id: userId
        },
        {projection: {_id: 1}}
      );

      if (!response) {
        throw new TRPCError({code: "NOT_FOUND", message: "Can't find repository with the given Id."});
      }

      const preferencesResult = await preferencesCollection.findOne({
        userId,
        repositoryId
      });
      if (!preferencesResult) {
        return RepositoryPreferencesSchema.parse({}); // defaults
      }

      const dbPreferences = DbRepositoryPreferencesSchema.parse({
        ...preferencesResult,
        _id: preferencesResult._id.toString()
      });
      return dbPreferences.preferences;
    }),

  // Update current user's preferences
  set: protectedProcedure
    .input(z.object({
      preferences: RepositoryPreferencesSchema,
      repositoryId: ObjectIdSchema
    }))
    .mutation(async ({input: {preferences, repositoryId}, ctx}) => {
      const userId = ctx.user._id;

      const repoPrefsCollection = getCollection<DbRepositoryPreferences>("repository_preferences");

      // todo check if repo exists

      const newDbValue: DbRepositoryPreferences = {
        preferences,
        userId,
        repositoryId
      };

      const result = await repoPrefsCollection.findOneAndUpdate(
        {
          userId,
          repositoryId
        },
        {
          $set: newDbValue
        },
        {
          upsert: true,
          returnDocument: "after"
        }
      );

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR"
        });
      }

      return result;
    }),

  setBranchVisibility: protectedProcedure
    .input(
      z.object({
        repositoryId: ObjectIdSchema,
        branchName: z.string(),
        hidden: z.boolean()
      })
    )
    .mutation(async ({ctx, input: {repositoryId, branchName, hidden}}) => {
      const userId = ctx.user._id;

      const preferencesCollection = getCollection<DbRepositoryPreferences>("repository_preferences");

      const update = hidden
        ? {
          $addToSet: {
            "preferences.hiddenBranches": branchName
          }
        }
        : {
          $pull: {
            "preferences.hiddenBranches": branchName
          }
        };

      const result = await preferencesCollection.findOneAndUpdate(
        {
          repositoryId,
          userId
        },
        update
      );

      console.log(result);
    }),

  getBranchVisibility: protectedProcedure
    .input(
      z.object({
        repositoryId: ObjectIdSchema,
        branchName: z.string()
      })
    )
    .query(async ({ctx, input: {repositoryId, branchName}}) => {
      const userId = ctx.user._id;

      const preferencesCollection =
        getCollection<DbRepositoryPreferences>("repository_preferences");

      const preferences = await preferencesCollection.findOne({
        repositoryId,
        userId
      });

      return {
        hidden: preferences?.preferences.hiddenBranches.includes(branchName) ?? false
      };
    })

});
