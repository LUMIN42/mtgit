import {z} from "zod";

/**
 * Some objects have mongo _id generated as a uuid.
 * The preprocessing allows for easy reading straight from the db.
 *
 * The rest of the dbTypes can be found in /apps/api/src/dbTypes.ts
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
