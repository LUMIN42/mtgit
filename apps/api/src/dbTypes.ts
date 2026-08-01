import {z} from "zod";
import {
  BranchSnapshotSchema,
  ObjectIdSchema,
  RepositoryPreferencesSchema,
  RepositorySchema,
  SessionSchema
} from "@mtgit/shared";
import {ObjectId} from "mongodb";

// These should be mainly used for type-safe writing into the database.
// These types must never get to the frontend,
// as they would import mongo ObjectId and with it all of mongo drivers.
// Learned the hard way.

/**
 * use {@link FrontendUserDataSchema} for frontend usage
 */
export const UserSchema = z.object({
  _id: z.string(),
  username: z.string(),
  password_hash: z.string()
});

export type User = z.infer<typeof UserSchema>;

export type Session = z.infer<typeof SessionSchema>;

/**
 * use {@link RepositoryPreferencesSchema} for frontend usage
 */
export const DbRepositoryPreferencesSchema = z.object({
  userId: z.uuid(),
  repositoryId: ObjectIdSchema,
  preferences: RepositoryPreferencesSchema
});

/**
 * use {@link RepositoryPreferences} for frontend usage
 */
export type DbRepositoryPreferences = z.infer<typeof DbRepositoryPreferencesSchema>;


export const MongoObjectIdSchema = z.instanceof(ObjectId);

/**
 * use {@link RepositorySchema} for frontend usage
 */
export const DbRepositorySchema = RepositorySchema
  .extend({_id: MongoObjectIdSchema});

/**
 * use {@link Repository} for frontend usage
 */
export type DbRepository = z.infer<typeof DbRepositorySchema>;

/**
 * use {@link BranchSnapshotSchema} for frontend usage
 */
export const DbBranchSnapshotSchema = z.object({
  _id: MongoObjectIdSchema,
  deckId: ObjectIdSchema,
  branchName: z.string(),
  snapshot: BranchSnapshotSchema,
  isDailySnapshot: z.boolean(),
  day: z.string() // e. g. 2026-07-14
});

/**
 * use {@link BranchSnapshot} for frontend usage
 */
export type DbBranchSnapshot = z.infer<typeof DbBranchSnapshotSchema>;