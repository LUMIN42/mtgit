import z from "zod";

export type TagsMap = Record<string, string[]>;

export const OPTIONAL_DECK_SECTION_NAMES = ["Commander", "Sideboard", "Considering"] as const;
export const DECK_SECTION_NAMES = ["Main", ...OPTIONAL_DECK_SECTION_NAMES] as const;

export const DeckSectionNameSchema = z.enum(DECK_SECTION_NAMES);
export const OptionalDeckSectionNameSchema = z.enum(OPTIONAL_DECK_SECTION_NAMES);

export type DeckSectionName = typeof DECK_SECTION_NAMES[number];
export type OptionalDeckSectionName = typeof OPTIONAL_DECK_SECTION_NAMES[number];

export const TagsMapSchema = z.record(
  z.string(),
  z.array(z.string())
);

export const OracleIdSchema = z.string();

export const CardCountsSchema = z.record(
  OracleIdSchema,
  z.number()
);

export const DeckCardCountsSchema = z
  .partialRecord(OptionalDeckSectionNameSchema, CardCountsSchema)
  .and(
    z.object({
      Main: CardCountsSchema
    })
  );

export function emptyDeckCardCounts(): DeckCardCounts {
  return {Main: {}};
}

export const BranchesSchema = z.record(
  z.string(),
  DeckCardCountsSchema
);

export const RepositorySchema = z.object({
  name: z.string(),
  tags: TagsMapSchema,
  branches: BranchesSchema
});

export type OracleId = z.infer<typeof OracleIdSchema>;
export type CardCounts = z.infer<typeof CardCountsSchema>;
export type DeckCardCounts = z.infer<typeof DeckCardCountsSchema>;
export type Branches = z.infer<typeof BranchesSchema>;
export type Repository = z.infer<typeof RepositorySchema>;

export function copyDeckCardAmounts(cardAmounts: DeckCardCounts) {
  return {...cardAmounts};
}

/**
 * Merge two tag maps, preserving existing tags and adding any new ones.
 */
export function mergeTagsMaps(currentTags: TagsMap, importedTags: TagsMap): TagsMap {
  const merged: TagsMap = {...currentTags};

  for (const [cardId, tags] of Object.entries(importedTags) as [string, string[]][]) {
    const existingTags = merged[cardId] ?? [];
    merged[cardId] = Array.from(new Set([...existingTags, ...tags]));
  }

  return merged;
}

export function mergeDecks(
  a: CardCounts,
  b: CardCounts
): CardCounts {
  const result: CardCounts = {...a};

  for (const [oracleId, count] of Object.entries(b)) {
    result[oracleId] = (result[oracleId] ?? 0) + count;
  }

  return result;
}

export function createEmptyRepository(): Repository {
  return {
    name: "New Deck Repository",
    tags: {},
    branches: {
      "main": {
        "Main": {}
      }
    }
  };
}