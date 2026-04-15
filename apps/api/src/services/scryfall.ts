import { ScryfallOracleCardSchema } from '@mtgit/shared/scryfall';

import { MongoService } from '../db/mongo.js';

/**
 * Database service layer for Scryfall card operations.
 * Wraps MongoService with business logic and validation.
 */
export class ScryfallService {
  private readonly mongoService: MongoService;

  constructor(mongoService: MongoService) {
    this.mongoService = mongoService;
  }

  async ping(): Promise<{
    ok: boolean;
    message: string;
  }> {
    try {
      const isConnected = await this.mongoService.ping();
      return {
        ok: isConnected,
        message: isConnected
          ? 'MongoDB connection successful.'
          : 'MongoDB connection failed.',
      };
    } catch {
      return {
        ok: false,
        message: 'MongoDB connection failed.',
      };
    }
  }

  async getFirstCard(): Promise<{
    ok: boolean;
    message: string;
    document: any | null;
  }> {
    try {
      const scryfallCollection = this.mongoService.getCollection('scryfall_cards');
      const document = await scryfallCollection.findOne({}, { sort: { _id: 1 } });

      if (!document) {
        return {
          ok: false,
          message: 'No documents found in mtgit.scryfall_cards.',
          document: null,
        };
      }

      const parsed = ScryfallOracleCardSchema.safeParse(document);
      if (!parsed.success) {
        return {
          ok: false,
          message: 'Document validation failed.',
          document: null,
        };
      }

      return {
        ok: true,
        message: 'Retrieved first document from mtgit.scryfall_cards.',
        document: parsed.data,
      };
    } catch {
      return {
        ok: false,
        message: 'Failed to read from mtgit.scryfall_cards.',
        document: null,
      };
    }
  }
}


