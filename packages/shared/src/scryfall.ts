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
    colors: z.array(z.string()).catch(() => []), // todo handle adventure and prepared cards
    image_uris: ImageUrisSchema.optional() // again, adventures break this
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
    card_faces: z.array(CardFaceSchema).optional(),
    // mana_cost: z.string().optional(),
    cmc: z.number(),
    type_line: z.string(),
    // oracle_text: z.string().optional(),
    // power: z.string().optional(),
    // toughness: z.string().optional(),

    // fixme colors: ColorIdentitySchema.catch([]), // the catch is needed for two-sided cards, which lack colors
    color_identity: ColorCombinationSchema,
    produced_mana: ColorCombinationSchema.catch([] as ColorCombination),
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
    image_uris: ImageUrisSchema,
    colors: ColorCombinationSchema
  })
);


const DoubleFacedScryfallOracleCardSchema = ScryfallOracleCardBaseSchema.extend(
  {card_faces: z.array(CardFaceSchema)}
);

type DoubleFacedScryfallOracleCard = z.infer<typeof DoubleFacedScryfallOracleCardSchema>;

const AdventureOracleCardSchema = DoubleFacedScryfallOracleCardSchema
  .extend({
    image_uris: ImageUrisSchema
  });


export const OracleCardSchema =
  z.preprocess(
      rawCard => {
        const singleFacedParsing = SingleFacedScryfallOracleCardSchema.safeParse(rawCard);
        if (singleFacedParsing.success) {

          return {
            ...singleFacedParsing.data,
            card_faces: [{...singleFacedParsing.data, object: "card_face"}]
          };
        }

        const adventureParsing = AdventureOracleCardSchema.safeParse(rawCard);
        if (adventureParsing.success) {
          const adventureCard = adventureParsing.data;

          const modifiedCard: DoubleFacedScryfallOracleCard = {
            ...adventureCard,
            card_faces: [
              {
                ...(adventureCard.card_faces[0]),
                image_uris: adventureCard.image_uris
              },
              ...adventureCard.card_faces.slice(1)
            ]
          };

          return modifiedCard;
        }

        return rawCard;
      },
      DoubleFacedScryfallOracleCardSchema
    )
    .transform(parsed => {
      return {
        ...parsed,
        colors: [...new Set(parsed.card_faces
          .filter(face => face.colors)
          .flatMap(face => face.colors))] as ColorCombination
      };
    });


// Live Scryfall API payloads can occasionally omit fields this app expects.
// This variant keeps core identifiers strict while filling optional app fields.
// export const ScryfallApiOracleCardSchema = DoubleFacedScryfallOracleCardSchema.extend({
//   cmc: z.number().catch(0),
//   type_line: z.string().catch(""),
//   colors: ColorCombinationSchema.catch([]),
//   color_identity: ColorCombinationSchema.catch([]),
//   keywords: z.array(z.string()).catch([]),
//   legalities: LegalitiesSchema.catch({}),
//   games: z.array(z.string()).catch([]),
//   set: z.string().catch(""),
//   set_name: z.string().catch(""),
//   rarity: z.string().catch("common")
// });
export const ScryfallApiCardIdSchema = z.object({
  oracle_id: OracleIdSchema
}).transform(
  card => OracleIdSchema.parse(card.oracle_id)
);

export const ScryfallSearchListSchema = z.object({
  object: z.literal("list"),
  has_more: z.boolean(),
  data: z.array(ScryfallApiCardIdSchema),
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

export type ImageUris = z.infer<typeof ImageUrisSchema>;
export type CardFace = z.infer<typeof CardFaceSchema>;
export type Legalities = z.infer<typeof LegalitiesSchema>;
export type Prices = z.infer<typeof PricesSchema>;
export type OracleCard = z.infer<typeof OracleCardSchema>;
export type ScryfallApiOracleCard = z.infer<typeof ScryfallApiCardIdSchema>;

export function getCardImageUrls(card: OracleCard): [string] | [string, string] {
  const urls = card.card_faces
    .filter(face => "image_uris" in face)
    .map(face => face.image_uris!.normal!)!;

  if (urls.length === 1) {
    return [urls[0]];
  }
  else if (urls.length === 2) {
    return [urls[0], urls[1]];
  }

  else {
    console.log(card);
    console.log(urls);
    throw new Error(`wrong card uris object: ${urls}`);
  }
}


