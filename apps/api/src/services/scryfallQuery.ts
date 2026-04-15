import { z } from 'zod';
import { ScryfallOracleCardSchema } from '@mtgit/shared/scryfall';

import { MongoService } from '../db/mongo.js';

/**
 * Query parameters for Scryfall card searches.
 */
export const ScryfallQuerySchema = z.object({
  name: z.string().optional(),
  colors: z.array(z.string()).optional(),
  type_line: z.string().optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'mythic']).optional(),
  mana_cost: z.string().optional(),
  oracle_text: z.string().optional(),
  set: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  skip: z.number().int().nonnegative().default(0),
});

export type ScryfallQuery = z.infer<typeof ScryfallQuerySchema>;

/**
 * Query service for Scryfall cards.
 * Builds MongoDB queries from filter parameters and validates results.
 */
export class ScryfallQueryService {
  private readonly mongoService: MongoService;

  constructor(mongoService: MongoService) {
    this.mongoService = mongoService;
  }

  async search(query: ScryfallQuery): Promise<{
    ok: boolean;
    message: string;
    cards: any[];
    total: number;
  }> {
    try {
      const scryfallCollection = this.mongoService.getCollection('scryfall_cards');

      // Build MongoDB filter from query parameters
      const filter: Record<string, any> = {};

      if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' };
      }

      if (query.colors && query.colors.length > 0) {
        filter.colors = { $all: query.colors };
      }

      if (query.type_line) {
        filter.type_line = { $regex: query.type_line, $options: 'i' };
      }

      if (query.rarity) {
        filter.rarity = query.rarity;
      }

      if (query.mana_cost) {
        filter.mana_cost = query.mana_cost;
      }

      if (query.oracle_text) {
        filter.oracle_text = { $regex: query.oracle_text, $options: 'i' };
      }

      if (query.set) {
        filter.set = query.set;
      }

      // Get total count matching the filter
      const total = await scryfallCollection.countDocuments(filter);

      // Fetch paginated results
      const cards = await scryfallCollection
        .find(filter)
        .skip(query.skip)
        .limit(query.limit)
        .toArray();

      // Validate each card against the schema
      const validatedCards = cards
        .map((card) => ScryfallOracleCardSchema.safeParse(card))
        .filter((result) => result.success)
        .map((result) => result.data);

      return {
        ok: true,
        message: `Found ${validatedCards.length} card(s) matching the query.`,
        cards: validatedCards,
        total,
      };
    } catch {
      return {
        ok: false,
        message: 'Failed to query scryfall_cards collection.',
        cards: [],
        total: 0,
      };
    }
  }

  async searchByName(name: string, limit: number = 10): Promise<{
    ok: boolean;
    message: string;
    cards: any[];
  }> {
    return this.search({ name, limit, skip: 0 });
  }

  async searchByColor(colors: string[], limit: number = 10): Promise<{
    ok: boolean;
    message: string;
    cards: any[];
  }> {
    return this.search({ colors, limit, skip: 0 });
  }

  async searchByType(type_line: string, limit: number = 10): Promise<{
    ok: boolean;
    message: string;
    cards: any[];
  }> {
    return this.search({ type_line, limit, skip: 0 });
  }
}


