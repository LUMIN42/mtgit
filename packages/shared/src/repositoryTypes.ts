import {z} from "zod";
import {Format, FormatSchema} from "./deckFormats.js";
import {relevantSections} from "./cardTypes.js";

export type TagsMap = Record<string, string[]>;

export const OPTIONAL_DECK_SECTION_NAMES = [
  "Commander",
  "Sideboard",
  "Considering"
] as const;

export const DECK_SECTION_NAMES = [
  "Main",
  ...OPTIONAL_DECK_SECTION_NAMES
] as const;

export const DeckSectionNameSchema = z.enum(DECK_SECTION_NAMES);
export const OptionalDeckSectionNameSchema = z.enum(OPTIONAL_DECK_SECTION_NAMES);

export type DeckSectionName = (typeof DECK_SECTION_NAMES)[number];
export type OptionalDeckSectionName =
  (typeof OPTIONAL_DECK_SECTION_NAMES)[number];

export const TagsMapSchema = z.record(z.string(), z.array(z.string()));

export const OracleIdSchema = z.string();

export const CardCountsSchema = z.record(OracleIdSchema, z.number().int().positive());

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

/**
 * Each deck section must contain optional sections,
 * Main is enforced separately in refinement.
 */
export const DeckCardCountsSchema = z
  .partialRecord(
    OptionalDeckSectionNameSchema.or(z.literal("Main")),
    CardCountsSchema
  )
  .superRefine((val, ctx) => {
    if (!val.Main) {
      ctx.addIssue({
        code: "custom",
        message: "Main is required",
        path: ["Main"]
      });
    }
  });

export function emptyDeckCardCounts(format?: Format): DeckCardCounts {
  if (format === undefined) {
    return {Main: {}};
  }

  return Object.fromEntries(
    relevantSections(format)
      .map(sectionName => [sectionName, {}])
  );
}

export const BranchesSchema = z.record(
  z.string(),
  DeckCardCountsSchema
);

export const RepositorySchema = z.object({
  name: z.string(),
  _id: ObjectIdSchema,
  owner_id: z.string(),
  tags: TagsMapSchema,
  branches: BranchesSchema,
  format: FormatSchema
});

export type OracleId = z.infer<typeof OracleIdSchema>;
export type CardCounts = z.infer<typeof CardCountsSchema>;
export type DeckCardCounts = z.infer<typeof DeckCardCountsSchema>;
export type Branches = z.infer<typeof BranchesSchema>;
export type Repository = z.infer<typeof RepositorySchema>;


export function createEmptyRepositoryTemplate(name: string, owner_id: string, format: Format) {
  return {
    name,
    owner_id,
    tags: {},
    branches: {
      main: emptyDeckCardCounts(format)
    },
    format
  };
}

export function allDeckOracleIds(cardCounts: DeckCardCounts) {
  const result = new Set<string>();

  for (const sectionNameRaw in cardCounts) {
    const sectionName = sectionNameRaw as DeckSectionName;

    for (const oracleId of Object.keys(cardCounts[sectionName]!)) {
      result.add(oracleId);
    }
  }

  return [...result.keys()];
}

export function copyDeckCardAmounts(cardAmounts: DeckCardCounts) {
  return {...cardAmounts};
}

export function mergeTagsMaps(currentTags: TagsMap, importedTags: TagsMap): TagsMap {
  const merged: TagsMap = {...currentTags};

  for (const [cardId, tags] of Object.entries(importedTags)) {
    const existingTags = merged[cardId] ?? [];
    merged[cardId] = Array.from(new Set([...existingTags, ...tags]));
  }

  return merged;
}

export function mergeCardCounts(a: CardCounts, b: CardCounts): CardCounts {
  const result: CardCounts = {...a};

  for (const [oracleId, count] of Object.entries(b)) {
    result[oracleId] = (result[oracleId] ?? 0) + count;
  }

  return result;
}