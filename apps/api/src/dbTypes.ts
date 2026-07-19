import {z} from "zod";
import {BranchSnapshotSchema, ObjectIdSchema, RepositoryPreferencesSchema, RepositorySchema} from "@mtgit/shared";
import {ObjectId} from "mongodb";

export const DbRepositoryPreferencesSchema = z.object({
  userId: z.uuid(),
  repositoryId: ObjectIdSchema,
  preferences: RepositoryPreferencesSchema
});

export type DbRepositoryPreferences = z.infer<typeof DbRepositoryPreferencesSchema>;


export const MongoObjectIdSchema = z.instanceof(ObjectId);


export const DbRepositorySchema = RepositorySchema
  .extend({_id: MongoObjectIdSchema});

export type DbRepository = z.infer<typeof DbRepositorySchema>;

export const DbBranchSnapshotSchema = z.object({
  deckId: ObjectIdSchema,
  branchName: z.string(),
  snapshot: BranchSnapshotSchema,
  isDailySnapshot: z.boolean(),
  day: z.string() // e. g. 2026-07-14
});

export type DbBranchSnapshot = z.infer<typeof DbBranchSnapshotSchema>;