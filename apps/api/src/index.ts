/**
 * Standalone server entry (local dev, Render).
 *
 * Serves frontend and starts listening.
 * Vercel uses {@link app} directly instead, see /api/index.mjs.
 */

import path from "node:path";
import {fileURLToPath} from "node:url";

import express from "express";

import {app} from "./app.js";
import {initMongo} from "./db/mongo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT ?? 3001);

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
