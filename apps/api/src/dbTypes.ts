import {z} from "zod";
import {ObjectIdSchema, RepositoryPreferencesSchema} from "@mtgit/shared";

export const DbRepositoryPreferencesSchema = z.object({
  userId: z.uuid(),
  repositoryId: ObjectIdSchema,
  preferences: RepositoryPreferencesSchema
});

export type DbRepositoryPreferences = z.infer<typeof DbRepositoryPreferencesSchema>;


