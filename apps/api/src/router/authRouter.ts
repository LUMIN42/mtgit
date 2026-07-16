import {z} from "zod";

import {protectedProcedure, publicProcedure, router} from "../trpc.js";
import {authService, register} from "../services/authService.js";

export const SESSION_COOKIE_NAME = "mtgit_session";

export const authRouter = router({
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

  me: protectedProcedure.query(({ctx}) => {
    return {
      sessionId: ctx.session._id,
      userId: ctx.user._id,
      username: ctx.user.username,
      expiresAt: ctx.session.validity_ends
    };
  })
});