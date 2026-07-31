import {z} from "zod";
import {DeckCardCountsSchema, ObjectIdSchema} from "./repositoryTypes.js";

export const BranchSnapshotSchema = z.object({
  timestamp: z.coerce.date(),
  cards: DeckCardCountsSchema,
  _id: ObjectIdSchema
});

export type BranchSnapshot = z.infer<typeof BranchSnapshotSchema>;