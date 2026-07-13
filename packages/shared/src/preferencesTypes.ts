import {z} from "zod";
import {OracleIdSchema} from "./repositoryTypes.ts";

// saved separately in case we will later allow multiple people edit the same deck
export const RepositoryPreferencesSchema = z.object({
  defaultQuery: z.string().default("")
});

export type RepositoryPreferences = z.infer<typeof RepositoryPreferencesSchema>;

