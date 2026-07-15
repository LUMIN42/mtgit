import {z} from "zod";
import {ObjectIdSchema, RepositoryPreferencesSchema, RepositorySchema} from "@mtgit/shared";
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