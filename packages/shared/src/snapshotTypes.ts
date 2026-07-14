import {z} from "zod";
import {DeckCardCountsSchema} from "./repositoryTypes.js";

export const BranchSnapshotSchema = z.object({
  timestamp: z.date(),
  cards: DeckCardCountsSchema
});

export type BranchSnapshot = z.infer<typeof BranchSnapshotSchema>;