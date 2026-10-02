/**
 * Configures Express and attaches the trpc server to it.
 *
 * Resolves .env variables.
 * Handles CORS.
 * Connects to MongoDB lazily, so the app also works as a serverless function (Vercel).
 */

import path from "node:path";

import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import type {Db} from "mongodb";

import {appRouter} from "./router/routerDispatcher.js";
import {initMongo} from "./db/mongo.js";

import cookieParser from "cookie-parser";


const envPaths = [
  path.resolve(process.cwd(), "apps/api/.env"),
  path.resolve(process.cwd(), ".env")
];

for (const envPath of envPaths) {
  const result = dotenv.config({path: envPath});

  if (!result.error) {
    break;
  }
}

export const app = express();

// Default to same origin for production, localhost for dev
const defaultBackendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3001",
  defaultBackendUrl
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like curl or mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);


app.use(express.json());


app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ok: true});
});

// Shared between concurrent requests so only one connection is opened per instance
let mongoReady: Promise<Db> | null = null;

app.use(async (_req, _res, next) => {
  mongoReady ??= initMongo().catch((error: unknown) => {
    mongoReady = null;
    throw error;
  });
  await mongoReady;
  next();
});

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({req, res}) => ({req, res})
  })
);

export default app;
