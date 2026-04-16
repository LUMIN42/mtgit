import {z} from 'zod';

export const ScryfallImageUrisSchema = z
  .object({
    small: z.string(),
    normal: z.string(),
    large: z.string(),
    png: z.string(),
    art_crop: z.string(),
    border_crop: z.string(),
  })
  .passthrough();

export const ScryfallCardFaceSchema = z
  .object({
    object: z.literal('card_face'),
    name: z.string(),
    mana_cost: z.string().optional(),
    type_line: z.string(),
    oracle_text: z.string().optional(),
    colors: z.array(z.string()).optional(),
    image_uris: ScryfallImageUrisSchema.optional(),
  })
  .passthrough();

export const ScryfallLegalitiesSchema = z.record(z.string(), z.string());

export const ScryfallPricesSchema = z
  .object({
    usd: z.string().nullable().optional(),
  })
  .passthrough();

export const ScryfallOracleCardSchema = z
  .object({
    object: z.literal('card'),
    id: z.string(),
    oracle_id: z.string(),
    name: z.string(),
    lang: z.string(),
    released_at: z.string(),
    layout: z.string(),
    image_uris: ScryfallImageUrisSchema.optional(),
    card_faces: z.array(ScryfallCardFaceSchema).optional(),
    mana_cost: z.string().optional(),
    cmc: z.number(),
    type_line: z.string(),
    oracle_text: z.string().optional(),
    power: z.string().optional(),
    toughness: z.string().optional(),
    colors: z.array(z.string()),
    color_identity: z.array(z.string()),
    keywords: z.array(z.string()),
    legalities: ScryfallLegalitiesSchema,
    games: z.array(z.string()),
    set: z.string(),
    set_name: z.string(),
    rarity: z.string(),
    prices: ScryfallPricesSchema.optional(),
  })
  .passthrough();

// Live Scryfall API payloads can occasionally omit fields this app expects.
// This variant keeps core identifiers strict while filling optional app fields.
export const ScryfallApiOracleCardSchema = ScryfallOracleCardSchema.extend({
  cmc: z.number().catch(0),
  type_line: z.string().catch(''),
  colors: z.array(z.string()).catch([]),
  color_identity: z.array(z.string()).catch([]),
  keywords: z.array(z.string()).catch([]),
  legalities: ScryfallLegalitiesSchema.catch({}),
  games: z.array(z.string()).catch([]),
  set: z.string().catch(''),
  set_name: z.string().catch(''),
  rarity: z.string().catch('common'),
}).passthrough();

export const ScryfallSearchListSchema = z.object({
  object: z.literal('list'),
  has_more: z.boolean(),
  data: z.array(ScryfallApiOracleCardSchema),
  total_cards: z.number().int().nonnegative(),
  next_page: z.string().url().optional(),
  warnings: z.array(z.string()).optional(),
}).passthrough();

export const ScryfallErrorSchema = z.object({
  object: z.literal('error'),
  code: z.string(),
  status: z.number().int(),
  details: z.string(),
  type: z.string().optional(),
  warnings: z.array(z.string()).optional(),
}).passthrough();

export const ScryfallSearchResponseSchema = z.union([
  ScryfallSearchListSchema,
  ScryfallErrorSchema,
]);

export type ScryfallImageUris = z.infer<typeof ScryfallImageUrisSchema>;
export type ScryfallCardFace = z.infer<typeof ScryfallCardFaceSchema>;
export type ScryfallLegalities = z.infer<typeof ScryfallLegalitiesSchema>;
export type ScryfallPrices = z.infer<typeof ScryfallPricesSchema>;
export type ScryfallOracleCard = z.infer<typeof ScryfallOracleCardSchema>;
export type ScryfallApiOracleCard = z.infer<typeof ScryfallApiOracleCardSchema>;

export function getCardImageUrl(card: ScryfallOracleCard): string | null {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null;
}

