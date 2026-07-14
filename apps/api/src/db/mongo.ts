import type {Collection, Db, Document, MongoClient} from "mongodb";
import {MongoClient as MongoClientImpl} from "mongodb";

const DEFAULT_DATABASE_NAME = "mtgit";

/**
 * Valid collection names in the mtgit database.
 */
export type CollectionName =
  "scryfall_cards"
  | "users"
  | "sessions"
  | "repositories"
  | "repository_preferences"
  | "branch_snapshots";

let cachedMongoUri: string | null = null;
let cachedMongoClient: MongoClient | null = null;
let cachedMongoDb: Db | null = null;

/**
 * Resolves the MongoDB connection string from an explicit argument or the environment.
 * @param mongoUri - Optional connection string override.
 * @returns The MongoDB connection string.
 */
function resolveMongoUri(mongoUri?: string): string {
  const uriFromGlobal = (globalThis as {process?: {env?: Record<string, string | undefined>}})
    .process?.env?.MONGODB_URI;
  const resolvedUri = mongoUri ?? uriFromGlobal;

  if (!resolvedUri) {
    throw new Error("MONGODB_URI is not set in the environment.");
  }

  return resolvedUri;
}

/**
 * Connects to MongoDB once and caches the resulting database handle.
 * Call this during application startup.
 * @param mongoUri - Optional connection string override.
 * @param databaseName - The database name to use.
 * @returns The connected database handle.
 */
export async function initMongo(mongoUri?: string, databaseName = DEFAULT_DATABASE_NAME): Promise<Db> {
  const resolvedUri = resolveMongoUri(mongoUri);

  if (cachedMongoDb) {
    if (cachedMongoUri !== resolvedUri) {
      throw new Error("MongoDB has already been initialized with a different URI.");
    }

    return cachedMongoDb;
  }

  cachedMongoUri = resolvedUri;
  cachedMongoClient = new MongoClientImpl(resolvedUri);
  await cachedMongoClient.connect();
  cachedMongoDb = cachedMongoClient.db(databaseName);

  return cachedMongoDb;
}

/**
 * Returns the initialized MongoDB database handle.
 * @returns The connected database handle.
 */
export function getMongoDb(): Db {
  if (!cachedMongoDb) {
    throw new Error("MongoDB has not been initialized. Call initMongo() during startup first.");
  }

  return cachedMongoDb;
}

/**
 * Returns a typed collection by name from the initialized database.
 * @param collectionName - The name of the collection to access.
 * @returns The collection handle.
 * @throws If MongoDB has not been initialized.
 */
export function getCollection<TSchema extends Document = Document>(
  collectionName: CollectionName
): Collection<TSchema> {
  return getMongoDb().collection<TSchema>(collectionName);
}


