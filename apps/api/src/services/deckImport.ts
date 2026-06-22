import type {DeckCardCounts, DeckSectionName} from "@mtgit/shared";
import {SECTION_BY_LABEL} from "@mtgit/shared";
import {getCollection} from "../db/mongo.js";
import {ScryfallOracleCardSchema} from "@mtgit/shared";

/**
 * Parsed raw line
 */
type ParsedDeckEntry = {
  quantity: number;
  cardName: string;
};

function parseDeckEntry(rawLine: string): ParsedDeckEntry {
  const lineRegex = /(\d+)\s+(.+)/;

  const match = rawLine.match(lineRegex);
  if (!match) {
    throw new Error(`Invalid line: ${rawLine}`);
  }

  return {
    quantity: Number(match[1]),
    cardName: match[2].trim()
  };
}

/**
 * Normalize name for DB lookup
 */
function normalizeCardName(name: string): string {
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
): Promise<DeckCardCounts> {
  const lines = importText.split(/\r?\n/);

  const sectionHeaderPattern =
    /^(Commander|Main|Sideboard|Considering)\s*:?$/i;

  let currentSection: DeckSectionName = "Main";

  const result: DeckCardCounts = {
    Main: {}
  };

  function add(section: DeckSectionName, oracleId: string, qty: number) {
    if (!result[section]) {
      result[section] = {};
    }

    const map = result[section]!;
    map[oracleId] = (map[oracleId] ?? 0) + qty;
  }

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

    const {quantity, cardName} = parseDeckEntry(line);

    const oracleId = await lookupOracleId(
      normalizeCardName(cardName)
    );

    if (!oracleId) {
      continue; // or collect missing cards if you want
    }

    add(currentSection, oracleId, quantity);
  }

  return result;
}