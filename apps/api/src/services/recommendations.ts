/**
 * Client for the card recommendation API (the dockerized Flask EASE service, see `mtgit recsys/api`).
 *
 * Everything crossing the boundary goes through zod: requests are built by parsing them with their schema,
 * responses (errors included) are parsed before use. A mismatch fails loudly in the log instead of
 * propagating malformed data.
 *
 * The recommendation API returns every recommendable card at once, best first.
 */

import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {
  CardCountsSchema,
  CardGroupSchema,
  GroupSourceSchema,
  OracleIdSchema,
  type DeckCardCounts,
  type GroupSource,
  type OracleId
} from "@mtgit/shared";

const RECSYS_API_URL = (process.env.RECSYS_API_URL ?? "http://127.0.0.1:5000").replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 60_000;

const NO_COMMANDER_MESSAGE = "Recommendations need a commander. Add one to the deck's Commander section.";

// ---------- recommendation API contract ----------

/** body of `POST /recommend` */
const RecommendRequestSchema = z.object({
  commander: OracleIdSchema,
  /** the whole deck including the commanders, oracle id -> count */
  deck: CardCountsSchema
});

/** response of `POST /recommend` */
const RecommendResponseSchema = z.object({
  commander: z.object({
    oracle_id: OracleIdSchema,
    name: z.string(),
    decks: z.number()
  }),
  additions: z.array(z.object({
    oracle_id: OracleIdSchema,
    score: z.number()
  }))
});

/** query parameters of `GET /neurons` and `GET /clusters` */
const GroupsRequestSchema = z.object({
  commander: OracleIdSchema
});

/** response of `GET /neurons` and `GET /clusters` (clusters are served in the neurons' shape) */
const GroupsResponseSchema = z.object({
  commander: z.object({
    oracle_id: OracleIdSchema,
    name: z.string()
  }),
  model: z.object({
    setting: z.string(),
    embedding: z.string()
  }),
  neurons: z.array(z.object({
    neuron: z.number().int(),
    label: z.string().optional(),
    coherent: z.boolean().optional(),
    explanation: z.string().optional(),
    cards: z.array(z.object({
      oracle_id: OracleIdSchema,
      activation: z.number()
    }))
  }))
});

/** body of every non-2xx response */
const RecsysErrorSchema = z.object({
  error: z.string()
});

const GROUP_SOURCE_PATHS: Record<GroupSource, string> = {
  neurons: "/neurons",
  clustering: "/clusters"
};

// ---------- results of this service ----------

const RecommendationsSchema = z.object({
  /** oracle ids, best first */
  cards: z.array(OracleIdSchema),
  commanderName: z.string().optional(),
  message: z.string().optional()
});

export type Recommendations = z.infer<typeof RecommendationsSchema>;

const CommanderGroupsSchema = z.object({
  groups: z.array(CardGroupSchema),
  commanderName: z.string().optional(),
  /** description of the model the groups come from */
  modelDescription: z.string().optional(),
  message: z.string().optional()
});

export type CommanderGroups = z.infer<typeof CommanderGroupsSchema>;

// ---------- transport ----------

/**
 * Either the parsed response, or an expected failure (like no model for the commander)
 * whose message is meant for the user.
 */
type RecsysResult<Data> =
  | {status: "ok", data: Data}
  | {status: "failed", message: string};

function internalError(message: string): TRPCError {
  return new TRPCError({code: "INTERNAL_SERVER_ERROR", message});
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  }
  catch {
    // not JSON, the schema reports it
    return undefined;
  }
}

async function readRecsysError(response: Response): Promise<string> {
  const parsed = RecsysErrorSchema.safeParse(await readJson(response));

  if (parsed.success) {
    return parsed.data.error;
  }

  console.error(
    `Recommendation API error response (status ${response.status}) does not match its schema`,
    z.prettifyError(parsed.error)
  );
  return `Recommendation API responded with status ${response.status}.`;
}

/**
 * Calls the recommendation API and parses its response with {@link responseSchema}.
 *
 * @param expectedFailures statuses meaning the request cannot be served (not an error), see {@link RecsysResult}
 * @throws TRPCError when the API is unreachable, fails unexpectedly, or responds in an unexpected format
 */
async function callRecsys<Schema extends z.ZodType>(
  path: string,
  init: RequestInit,
  responseSchema: Schema,
  expectedFailures: readonly number[]
): Promise<RecsysResult<z.infer<Schema>>> {
  let response: Response;

  try {
    response = await fetch(`${RECSYS_API_URL}${path}`, {
      ...init,
      headers: {Accept: "application/json", ...init.headers},
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  }
  catch (error) {
    console.error("Recommendation API unreachable", error);
    throw internalError("The recommendation service is unreachable.");
  }

  if (expectedFailures.includes(response.status)) {
    return {status: "failed", message: await readRecsysError(response)};
  }

  if (!response.ok) {
    const message = await readRecsysError(response);
    console.error("Recommendation API error", response.status, message);
    throw internalError(message);
  }

  const parsed = responseSchema.safeParse(await readJson(response));

  if (!parsed.success) {
    console.error(`Recommendation API ${path} response does not match its schema`, z.prettifyError(parsed.error));
    throw internalError("The recommendation service returned an unexpected response format.");
  }

  return {status: "ok", data: parsed.data};
}

// ---------- recommendations ----------

/**
 * Tries the deck's commanders in order (partners have separate models) and uses the first one with a model.
 */
async function computeRecommendations(
  commanders: OracleId[],
  deck: z.infer<typeof CardCountsSchema>
): Promise<Recommendations> {
  const messages: string[] = [];

  for (const commander of commanders) {
    const body = RecommendRequestSchema.parse({commander, deck});

    // 404: no model for the commander, 422: no card of the deck is known to the model
    const result = await callRecsys(
      "/recommend",
      {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)},
      RecommendResponseSchema,
      [404, 422]
    );

    if (result.status === "ok") {
      const deckCards = new Set(Object.keys(deck));

      return {
        // the other partner is in the deck, but not necessarily known to this commander's model as a deck card
        cards: result.data.additions
          .map(card => card.oracle_id)
          .filter(id => !deckCards.has(id)),
        commanderName: result.data.commander.name
      };
    }

    messages.push(result.message);
  }

  return {cards: [], message: messages.join(" ")};
}

/**
 * @returns the full recommendation ranking for a deck.
 */
export async function getRecommendations(deckCounts: DeckCardCounts): Promise<Recommendations> {
  const commanders = Object.keys(deckCounts.Commander ?? {});

  if (commanders.length === 0) {
    return {cards: [], message: NO_COMMANDER_MESSAGE};
  }

  return computeRecommendations(commanders, {
    ...deckCounts.Main,
    ...deckCounts.Commander
  });
}

// ---------- groups ----------

/**
 * @param source the sparse autoencoder neurons or the deck clusters, see {@link GroupSourceSchema}
 * @returns the card groups of the first of the deck's commanders that has them,
 * each with its cards. They do not depend on the deck's other cards.
 */
export async function getCommanderGroups(
  deckCounts: DeckCardCounts,
  source: GroupSource = "neurons"
): Promise<CommanderGroups> {
  const commanders = Object.keys(deckCounts.Commander ?? {});

  if (commanders.length === 0) {
    return {groups: [], message: NO_COMMANDER_MESSAGE};
  }

  const path = GROUP_SOURCE_PATHS[GroupSourceSchema.parse(source)];
  const messages: string[] = [];

  for (const commander of commanders) {
    const params = new URLSearchParams(GroupsRequestSchema.parse({commander}));

    // 404: no model (or clustering) for the commander
    const result = await callRecsys(`${path}?${params}`, {}, GroupsResponseSchema, [404]);

    if (result.status === "ok") {
      const {data} = result;

      return {
        commanderName: data.commander.name,
        modelDescription: source === "clustering"
          ? data.model.embedding
          : `${data.model.embedding}, SAE ${data.model.setting}`,
        groups: data.neurons.map(neuron => ({
          index: neuron.neuron,
          label: neuron.label,
          coherent: neuron.coherent,
          explanation: neuron.explanation,
          cards: neuron.cards.map(card => ({oracleId: card.oracle_id, activation: card.activation}))
        }))
      };
    }

    messages.push(result.message);
  }

  return {groups: [], message: messages.join(" ")};
}
