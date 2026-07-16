import {z} from "zod";

// saved separately in case we will later allow multiple people edit the same deck
export const RepositoryPreferencesSchema = z.object({
  defaultQuery: z.string().default(""),
  openBranchName: z.string().optional()
});

export type RepositoryPreferences = z.infer<typeof RepositoryPreferencesSchema>;

