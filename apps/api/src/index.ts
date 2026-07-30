/**
 * Configures Express and attaches the trpc server to it.
 *
 * Resolves .env variables.
 * Handles CORS.
 * Serves frontend.
 */

import path from "node:path";
import {fileURLToPath} from "node:url";

import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";

import {appRouter} from "./router/routerDispatcher.js";
import {initMongo} from "./db/mongo.js";

import cookieParser from "cookie-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


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

const app = express();
const port = Number(process.env.PORT ?? 3001);

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

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({req, res}) => ({req, res})
  })
);

const frontendDist = path.resolve(
  __dirname,
  "../../frontend/dist"
);

// frontend serving
app.use(express.static(frontendDist));

app.get(/.*/, (_, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

async function main(): Promise<void> {
  await initMongo();

  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });
}

void main().catch((error: unknown) => {
  console.error("Failed to start API server:", error);
  process.exit(1);
});

