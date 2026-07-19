import {getCollection} from "../db/mongo.js";
import type {Session, User} from "../dbTypes.js";
import {UserSchema} from "../dbTypes.js";

import {randomUUID} from "node:crypto";
import argon2 from "argon2";
import {TRPCError} from "@trpc/server";

export const hashPassword = (password: string) =>
  argon2.hash(password);

export const verifyPassword = (password: string, hash: string) =>
  argon2.verify(hash, password);

// 🟢 extracted session creation
async function createSession(userId: string) {
  const sessionsCollection = getCollection<Session>("sessions");

  const validityEnds = new Date(
    Date.now() + 1000 * 3600 * 24 * 14 // 14 days
  );

  const sessionId = randomUUID();

  await sessionsCollection.insertOne({
    _id: sessionId,
    user_id: userId,
    validity_ends: validityEnds
  });

  return {
    sessionId,
    expiresAt: validityEnds
  };
}

export async function authService(username: string, password: string) {
  const userCollection = getCollection<User>("users");

  const rawUser = await userCollection.findOne({username});

  if (!rawUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials"
    });
  }

  const user = UserSchema.parse(rawUser);

  const correctPassword = await verifyPassword(
    password,
    user.password_hash
  );

  if (!correctPassword) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials"
    });
  }

  const session = await createSession(user._id);

  return {
    userId: user._id,
    username: user.username,
    ...session
  };
}

export async function register(username: string, password: string) {
  const userCollection = getCollection<User>("users");

  const existingUser = await userCollection.findOne({username});

  if (existingUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Username already exists"
    });
  }

  const password_hash = await hashPassword(password);
  const userId = randomUUID();

  const newUser: User = {
    _id: userId,
    username,
    password_hash
  };

  await userCollection.insertOne(newUser);

  const session = await createSession(userId);

  return {
    userId,
    username,
    ...session
  };
}

export async function invalidateSession(sessionId: string) {
  const sessionsCollection = getCollection<Session>("sessions");
  await sessionsCollection.deleteOne({_id: sessionId});
}