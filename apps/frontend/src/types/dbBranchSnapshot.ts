import {z} from "zod";
import {ObjectIdSchema, BranchSnapshotSchema} from "@mtgit/shared";

export const DbBranchSnapshotSchema = z.object({
  deckId: ObjectIdSchema,
  branchName: z.string(),
  snapshot: BranchSnapshotSchema,
  isDailySnapshot: z.boolean(),
  day: z.string() // e. g. 2026-07-14
});

export type DbBranchSnapshot = z.infer<typeof DbBranchSnapshotSchema>;