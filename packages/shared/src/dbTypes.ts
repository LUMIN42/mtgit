import {z} from "zod";
import {ObjectIdSchema} from "./repositoryTypes.js";

const DbUuidSchema = z.preprocess(
  raw => String(raw),
  z.uuid()
);

export const DeckOverviewSchema = z.object({
  name: z.string(),
  last_updated: z.date(),
  deck_id: ObjectIdSchema
});

export const SessionSchema = z.object({
  _id: DbUuidSchema,
  user_id: z.string(),
  validity_ends: z.date()
});

export const FrontendUserDataSchema = z.object({
  _id: z.preprocess(
    raw => String(raw),
    z.string()
  ),
  username: z.string()
});

export type DeckOverview = z.infer<typeof DeckOverviewSchema>;
export type Session = z.infer<typeof SessionSchema>;
