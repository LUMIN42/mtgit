import {z} from "zod";

import {protectedProcedure, publicProcedure, router} from "../trpc.js";
import {authService, invalidateSession, register} from "../services/authService.js";
import {TRPCError} from "@trpc/server";
import {getCollection} from "../db/mongo.js";
import {FrontendUserDataSchema, Session, SessionSchema} from "@mtgit/shared";
import {User} from "../dbTypes.js";

export const SESSION_COOKIE_NAME = "mtgit_session";

export const authRouter = router({
  /**
   * Only sets cookies. Use /me endpoint for user info.
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string()
      })
    )
    .mutation(async ({input, ctx}) => {
      const session = await authService(
        input.username,
        input.password
      );

      ctx.res.cookie(SESSION_COOKIE_NAME, session.sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: session.expiresAt,
        path: "/"
      });

      return session;
    }),

  /**
   * Registers a new User.
   * Also sets cookies as per login.
   */
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3),
        password: z.string().min(6)
      })
    )
    .mutation(async ({input, ctx}) => {
      const session = await register(
        input.username,
        input.password
      );

      ctx.res.cookie(SESSION_COOKIE_NAME, session.sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: session.expiresAt,
        path: "/"
      });

      return session;
    }),

  /**
   * @returns the current session info in {@link FrontendUserDataSchema} based on the cookies sent.
   * @throws TRPCError if session is invalid or expired.
   */
  me: publicProcedure.query(async ({ctx}) => {
    const sessionId = ctx.req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionId) {
      return null;
    }

    const sessionsCollection = getCollection<Session>("sessions");
    const rawSession = await sessionsCollection.findOne({
      _id: sessionId,
      validity_ends: {$gt: new Date()}
    });

    if (!rawSession) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session not found or expired."
      });
    }

    const session = SessionSchema.parse(rawSession);

    const userCollection = getCollection<User>("users");

    // todo handle deleted users
    const userRaw = await userCollection.findOne({_id: session.user_id});
    return FrontendUserDataSchema.parse(userRaw);
  }),

  /**
   * Only clears cookies. Use /me endpoint for session info.
   */
  logout: protectedProcedure
    .mutation(async ({ctx}) => {
      await invalidateSession(ctx.session._id);

      ctx.res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });

      return {success: true};
    })
});