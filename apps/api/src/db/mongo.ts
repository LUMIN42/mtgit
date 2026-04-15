import { MongoClient, Db } from 'mongodb';

/**
 * Singleton MongoDB service for dependency injection.
 * Manages connection pooling and provides query methods.
 */
export class MongoService {
  private static instance: MongoService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private readonly mongoUri: string;

  private constructor(mongoUri: string) {
    this.mongoUri = mongoUri;
  }

  static getInstance(mongoUri?: string): MongoService {
    if (!MongoService.instance) {
      const uriFromGlobal = (globalThis as { process?: { env?: Record<string, string | undefined> } })
        .process?.env?.MONGODB_URI;
      const uri = mongoUri ?? uriFromGlobal;
      if (!uri) {
        throw new Error('MONGODB_URI is not set in the environment.');
      }
      MongoService.instance = new MongoService(uri);
    }
    return MongoService.instance;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }
    this.client = new MongoClient(this.mongoUri);
    await this.client.connect();
    this.db = this.client.db('mtgit');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client) {
      await this.connect();
    }
    try {
      await this.client!.db().admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  getCollection(name: string) {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db.collection(name);
  }
}

export async function getMongoService(mongoUri?: string): Promise<MongoService> {
  const service = MongoService.getInstance(mongoUri);
  await service.connect();
  return service;
}

