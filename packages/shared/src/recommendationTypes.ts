/**
 * Contract of the `recommendations` tRPC router, validated on both input and output,
 * so the frontend and the backend cannot silently drift apart.
 */

import {z} from "zod";
import {DeckCardCountsSchema, OracleIdSchema} from "./repositoryTypes.js";

export const RECOMMENDATIONS_PAGE_SIZE = 175;

const QuerySchema = z.string().max(1000).default("");

// ---------- recommendations.search ----------

export const RecommendationSearchInputSchema = z.object({
  deck: DeckCardCountsSchema,
  query: QuerySchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(1000).default(RECOMMENDATIONS_PAGE_SIZE)
});

export const RecommendationSearchOutputSchema = z.object({
  /** oracle ids of the page, best first */
  cards: z.array(OracleIdSchema),
  /** cards over all pages: the recommendations, then the other eligible cards */
  totalCards: z.number().int().nonnegative(),
  /** how many of {@link totalCards} are recommendations */
  recommendedCards: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  nextPage: z.number().int().min(2).optional(),
  commanderName: z.string().optional(),
  message: z.string().optional(),
  warnings: z.array(z.string())
});

export type RecommendationSearchInput = z.input<typeof RecommendationSearchInputSchema>;
export type RecommendationSearchOutput = z.infer<typeof RecommendationSearchOutputSchema>;

// ---------- recommendations.groups ----------

/**
 * Where the card groups come from: the sparse autoencoder neurons of the commander's recommendation
 * model (`order:neurons`), or the clusters of the commander's decks (`order:clustering`).
 */
export const GroupSourceSchema = z.enum(["neurons", "clustering"]);

export type GroupSource = z.infer<typeof GroupSourceSchema>;

export const GroupCardSchema = z.object({
  oracleId: OracleIdSchema,
  /** how strongly the card belongs to the group (neuron activation or cluster distinctiveness) */
  activation: z.number()
});

/** A neuron of the recommendation model or a cluster of the commander's decks, see {@link GroupSourceSchema}. */
export const CardGroupSchema = z.object({
  index: z.number().int(),
  label: z.string().optional(),
  coherent: z.boolean().optional(),
  explanation: z.string().optional(),
  /** cards in the group, strongest first */
  cards: z.array(GroupCardSchema)
});

/** A {@link CardGroupSchema} whose cards were filtered by the search query. */
export const FilteredCardGroupSchema = CardGroupSchema.extend({
  /** cards in the group before filtering by the query */
  activeCards: z.number().int().nonnegative()
});

export const CommanderGroupsInputSchema = z.object({
  deck: DeckCardCountsSchema,
  query: QuerySchema,
  source: GroupSourceSchema.default("neurons")
});

export const CommanderGroupsOutputSchema = z.object({
  groups: z.array(FilteredCardGroupSchema),
  commanderName: z.string().optional(),
  /** description of the model the groups come from */
  modelDescription: z.string().optional(),
  message: z.string().optional(),
  warnings: z.array(z.string())
});

export type GroupCard = z.infer<typeof GroupCardSchema>;
export type CardGroup = z.infer<typeof CardGroupSchema>;
export type FilteredCardGroup = z.infer<typeof FilteredCardGroupSchema>;
export type CommanderGroupsInput = z.input<typeof CommanderGroupsInputSchema>;
export type CommanderGroupsOutput = z.infer<typeof CommanderGroupsOutputSchema>;
