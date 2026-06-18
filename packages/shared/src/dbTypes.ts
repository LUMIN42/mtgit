import {z} from "zod";

export const DeckOverviewSchema = z.object({
  name: z.string(),
  last_updated: z.date(),
  deck_id: z.string()
});

export const UserSchema = z.object({
  _id: z.string(),
  username: z.string(),
  password_hash: z.string()
});

export const SessionSchema = z.object({
  _id: z.string(),
  user_id: z.string(),
  validity_ends: z.date()
});

export type DeckOverview = z.infer<typeof DeckOverviewSchema>;
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
