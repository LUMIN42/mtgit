import {z} from "zod";

/**
 * Saved separately for each repo-user pair.
 * Currently only one per repo, as deck sharing is not implemented yet.
 */
export const RepositoryPreferencesSchema = z.object({
  defaultQuery: z.string().default(""),
  openBranchName: z.string().optional(),
  hiddenBranches: z.array(z.string()).default(() => [] as string[]),
  quickEdit: z.boolean().default(false),
  compressedHistory: z.boolean().default(true),
  legalOnlyHistory: z.boolean().default(false)
});

export type RepositoryPreferences = z.infer<typeof RepositoryPreferencesSchema>;

