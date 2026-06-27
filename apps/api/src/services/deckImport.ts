import {DeckCardCounts, DeckSectionName, emptyDeckCardCounts} from "@mtgit/shared";
import {SECTION_BY_LABEL} from "@mtgit/shared";
import {getCollection} from "../db/mongo.js";
import {ScryfallOracleCardSchema} from "@mtgit/shared";

/**
 * Parsed raw line
 */
type ParsedDeckEntry = {
  quantity: number;
  cardName: string;
  tags: string[];
};

function parseDeckEntry(rawLine: string): ParsedDeckEntry | null {
  const lineRegex = /^(\d+)\s+([^(#]+)(?:\s+[^#]*(#.*)?)?$/;

  const match = rawLine.match(lineRegex);

  if (!match) {
    return null;
  }

  const quantity = Number(match[1]);

  // ----------------------------
  // 1. Clean card name
  // ----------------------------
  const rawName = match[2].trim();

  // normalize split / MDFC separators
  const cardName = rawName
    .replace(/\s*\/\/\s*/g, " // ")
    .replace(/\s*\/\s*/g, " / ")
    .trim();

  // ----------------------------
  // 2. Tags
  // ----------------------------
  const tags = match[3]
    ? match[3]
      .trim()
      .split(/\s+/)
      .map(tag => tag.replace(/^#+/, "").trim())
      .filter(Boolean)
    : [];

  return {
    quantity,
    cardName,
    tags
  };
}

/**
 * Normalize name for DB lookup
 */
function normalizeCardName(name: string): string {
  if (name === "Order of Midnight / Alter Fate") {
    console.log("here we go!");
  }

  return name
    .toLowerCase()
    .replace(/\s*\/\/\s*/g, " // ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lookup oracle card ID by name
 */
async function lookupOracleId(name: string): Promise<string | null> {
  const cards = await getCollection("scryfall_cards")
    .find({normalized_name: name})
    .toArray();

  for (const raw of cards) {
    const parsed = ScryfallOracleCardSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data.oracle_id ?? parsed.data.id;
    }
  }

  return null;
}

/**
 * TEXT → DeckCardCounts (oracle ID based)
 */
export async function parseDeckImportText(
  importText: string
) {
  const lines = importText.split(/\r?\n/);

  const sectionHeaderPattern =
    /^(Commander|Main|Sideboard|Considering)\s*:?$/i;

  let currentSection: DeckSectionName = "Main";

  const resultingDeck: DeckCardCounts = emptyDeckCardCounts();

  const oracleTagsMap: Record<string, string[]> = {};

  function add(section: DeckSectionName, oracleId: string, qty: number) {
    if (!resultingDeck[section]) {
      resultingDeck[section] = {};
    }

    const map = resultingDeck[section]!;
    map[oracleId] = (map[oracleId] ?? 0) + qty;
  }

  type PendingLookup = {
    quantity: number;
    cardName: string;
    section: DeckSectionName;
  };

  const tasks: Promise<void>[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("//") || line.startsWith("#")) {
      continue;
    }

    const sectionMatch = line.match(sectionHeaderPattern);
    if (sectionMatch) {
      currentSection =
        SECTION_BY_LABEL[sectionMatch[1].toLowerCase()] ?? "Main";
      continue;
    }

    const parsingResult = parseDeckEntry(line);
    if (!parsingResult) {
      continue;
    }

    const {quantity, cardName, tags} = parsingResult;

    const capturedDeckSection = currentSection;
    const task = (async () => {
      const oracleId = await lookupOracleId(
        normalizeCardName(cardName)
      );

      if (!oracleId) {
        return;
      }

      // 🧠 store tags per oracleId (unused for now)
      oracleTagsMap[oracleId] = tags;

      add(capturedDeckSection, oracleId, quantity);
    })();

    tasks.push(task);
  }

  await Promise.all(tasks);

  return {resultingDeck, oracleTagsMap};
}