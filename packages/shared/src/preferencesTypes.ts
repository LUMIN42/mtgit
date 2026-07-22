import {z} from "zod";

// saved separately in case we will later allow multiple people edit the same deck
export const RepositoryPreferencesSchema = z.object({
  defaultQuery: z.string().default(""),
  openBranchName: z.string().optional(),
  hiddenBranches: z.array(z.string()).default(() => [] as string[]),
  quickEdit: z.boolean().default(false),
  compressedHistory: z.boolean().default(true),
  legalOnlyHistory: z.boolean().default(false)
});

export type RepositoryPreferences = z.infer<typeof RepositoryPreferencesSchema>;

