import {z} from "zod";

/**
 * Used for allowing frontend to use mongo id without having to convert it manually every time.
 * Frontend cannot import mongo types directly.
 */
const DbUuidSchema = z.preprocess(
  raw => String(raw),
  z.uuid()
);

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

export type Session = z.infer<typeof SessionSchema>;
