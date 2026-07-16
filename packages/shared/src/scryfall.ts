import {z} from "zod";
import {OracleIdSchema} from "./repositoryTypes.js";

export const ImageUrisSchema = z
  .object({
    small: z.string(),
    normal: z.string(),
    large: z.string(),
    png: z.string(),
    art_crop: z.string(),
    border_crop: z.string()
  })
;

export const CardFaceSchema = z
  .object({
    object: z.literal("card_face"),
    name: z.string(),
    mana_cost: z.string(),
    type_line: z.string(),
    oracle_text: z.string(),
    colors: z.array(z.string()),
    image_uris: ImageUrisSchema
  })
;

export const LegalitiesSchema = z.record(z.string(), z.string());

export const PricesSchema = z
  .object({
    usd: z.string().nullable().optional()
  })
;

export const COLOR_CODES = ["B", "W", "U", "R", "G"] as const;


export const ColorCodeSchema = z.enum(COLOR_CODES);

export type ColorCode = z.infer<typeof ColorCodeSchema>;

export const ColorCombinationSchema = z.array(ColorCodeSchema).refine(
  colors => new Set(colors).size === colors.length,
  {
    message: "Color identity must not contain duplicate colors"
  }
);

export type ColorCombination = z.infer<typeof ColorCombinationSchema>;


const ScryfallOracleCardBaseSchema = z
  .object({
    object: z.literal("card"),
    id: z.string(),
    oracle_id: OracleIdSchema,
    name: z.string(),
    lang: z.string(),
    released_at: z.string(),
    layout: z.string(),
    image_uris: ImageUrisSchema.optional(),
    card_faces: z.array(CardFaceSchema).optional(),
    mana_cost: z.string().optional(),
    cmc: z.number(),
    type_line: z.string(),
    oracle_text: z.string().optional(),
    power: z.string().optional(),
    toughness: z.string().optional(),

    // colors: ColorIdentitySchema.catch([]), // the catch is needed for two-sided cards, which lack colors
    color_identity: ColorCombinationSchema.catch([]),
    // keywords: z.array(z.string()),
    legalities: LegalitiesSchema,
    // games: z.array(z.string()),
    // set: z.string(),
    // set_name: z.string(),
    rarity: z.string(),
    prices: PricesSchema.optional()
  });

const SingleFacedScryfallOracleCardSchema = ScryfallOracleCardBaseSchema.and(
  z.object({
    name: z.string(),
    mana_cost: z.string(),
    type_line: z.string(),
    oracle_text: z.string(),
    image_uris: ImageUrisSchema
  })
);


const DoubleFacedScryfallOracleCardSchema = ScryfallOracleCardBaseSchema.extend(
  {card_faces: z.array(CardFaceSchema)}
);

export const ScryfallOracleCardSchema =
  z.preprocess(
      rawCard => {
        const singleFacedParsing = SingleFacedScryfallOracleCardSchema.safeParse(rawCard);
        if (singleFacedParsing.success) {

          return {
            ...singleFacedParsing.data,
            card_faces: [{...singleFacedParsing.data, object: "card_face"}]
          };
        }

        return rawCard;
      },
      DoubleFacedScryfallOracleCardSchema
    )
    .transform(parsed => {
      return {
        ...parsed,
        colors: [...new Set(parsed.card_faces.flatMap(face => face.colors))]
      };
    });


// Live Scryfall API payloads can occasionally omit fields this app expects.
// This variant keeps core identifiers strict while filling optional app fields.
export const ScryfallApiOracleCardSchema = DoubleFacedScryfallOracleCardSchema.extend({
  cmc: z.number().catch(0),
  type_line: z.string().catch(""),
  colors: ColorCombinationSchema.catch([]),
  color_identity: ColorCombinationSchema.catch([]),
  keywords: z.array(z.string()).catch([]),
  legalities: LegalitiesSchema.catch({}),
  games: z.array(z.string()).catch([]),
  set: z.string().catch(""),
  set_name: z.string().catch(""),
  rarity: z.string().catch("common")
});

export const ScryfallSearchListSchema = z.object({
  object: z.literal("list"),
  has_more: z.boolean(),
  data: z.array(ScryfallApiOracleCardSchema),
  total_cards: z.number().int().nonnegative(),
  next_page: z.string().url().optional(),
  warnings: z.array(z.string()).optional()
});

export const ScryfallErrorSchema = z.object({
  object: z.literal("error"),
  code: z.string(),
  status: z.number().int(),
  details: z.string(),
  type: z.string().optional(),
  warnings: z.array(z.string()).optional()
});

export const ScryfallSearchResponseSchema = z.union([
  ScryfallSearchListSchema,
  ScryfallErrorSchema
]);

export type ScryfallImageUris = z.infer<typeof ImageUrisSchema>;
export type ScryfallCardFace = z.infer<typeof CardFaceSchema>;
export type ScryfallLegalities = z.infer<typeof LegalitiesSchema>;
export type ScryfallPrices = z.infer<typeof PricesSchema>;
export type ScryfallOracleCard = z.infer<typeof ScryfallOracleCardSchema>;
export type ScryfallApiOracleCard = z.infer<typeof ScryfallApiOracleCardSchema>;

export function getCardImageUrl(card: ScryfallOracleCard): string | null {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null;
}

