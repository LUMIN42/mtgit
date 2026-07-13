import {TRPCError, initTRPC} from "@trpc/server";
import type {Request, Response} from "express";

import {getCollection} from "./db/mongo.js";
import type {Session, User} from "@mtgit/shared";
import {SessionSchema, UserSchema} from "@mtgit/shared";

export type TrpcContext = {
  req: Request;
  res: Response;
};

export type AuthenticatedContext = {
  session: Session;
  user: User;
};

const SESSION_COOKIE_NAME = "mtgit_session";

function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const prefix = `${name}=`;

  for (const part of cookieHeader.split(";")) {
    const cookie = part.trim();

    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }

  return undefined;
}

const t = initTRPC.context<TrpcContext>().create();

const loggerMiddleware = t.middleware(async ({path, type, next}) => {
  const start = Date.now();

  try {
    console.log("waiting for the next");
    const result = await next();
    if (!result.ok) {
      console.error(result.error);
      return result;
    }
    console.log(`➡️ ${type} ${path} (${Date.now() - start}ms)`);
    return result;
  }
  catch (err) {
    console.error(`❌ ${type} ${path} failed`);
    console.error(err);
    throw err;
  }
});

const authMiddleware = t.middleware(async ({ctx, next}) => {
  const sessionId = ctx.req.cookies?.[SESSION_COOKIE_NAME];

  if (!sessionId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not logged in"
    });
  }

  const sessionsCollection = getCollection<Session>("sessions");
  const rawSession = await sessionsCollection.findOne({_id: sessionId});

  if (!rawSession) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session not found"
    });
  }

  const session = SessionSchema.parse(rawSession);

  if (session.validity_ends <= new Date()) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session expired"
    });
  }

  const usersCollection = getCollection<User>("users");
  const rawUser = await usersCollection.findOne({_id: session.user_id});

  if (!rawUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found"
    });
  }

  const user = UserSchema.parse(rawUser);

  return next({
    ctx: {
      ...ctx,
      session,
      user
    }
  });
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const protectedProcedure = t.procedure.use(loggerMiddleware).use(authMiddleware);

