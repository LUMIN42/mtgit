import {DeckCardCounts, DeckSectionName} from "@mtgit/shared";
import {SECTION_BY_LABEL} from "@mtgit/shared";
import {getCollection} from "../db/mongo.js";
import {OracleCardSchema} from "@mtgit/shared";
import {z} from "zod";

/**
 * Parsed raw line
 */
type ParsedDeckEntry = {
  quantity: number;
  cardName: string;
  tags: string[];
  deckSection: DeckSectionName;
};

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

function parseDeckEntry(rawLine: string, deckSection: DeckSectionName): ParsedDeckEntry | null {
  const lineRegex = /^(\d+)\s+([^(#]+)(?:\s+[^#]*(#.*)?)?$/;

  const match = rawLine.match(lineRegex);

  if (!match) {
    return null;
  }

  const quantity = Number(match[1]);

  // ----------------------------
  // 1. Clean card name
  // ----------------------------
  const cardName = normalizeCardName(match[2].trim());

  // ----------------------------
  // 2. Tags
  // ----------------------------
  const tags = match[3]
    ? match[3]
      .trim()
      .split(/#/)
      .map(tag => tag.trim())
      .filter(Boolean)
    : [];

  return {
    quantity,
    cardName,
    tags,
    deckSection
  };
}

/**
 * Lookup oracle card ID by name
 */
async function lookupOracleId(name: string): Promise<string | null> {
  const cards = await getCollection("scryfall_cards")
    .find({normalized_name: name})
    .toArray();

  for (const raw of cards) {
    const parsed = OracleCardSchema.safeParse(raw);
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

  const hasExplicitSectionNames = lines.some(line => sectionHeaderPattern.test(line));

  let currentSection: DeckSectionName = "Main";

  const oracleTagsMap: Record<string, string[]> = {};

  const parsedLines: ParsedDeckEntry[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // comments
    if ((!line && hasExplicitSectionNames) || line.startsWith("//") || line.startsWith("#")) {
      continue;
    }

    const sectionMatch = line.match(sectionHeaderPattern);
    if (sectionMatch) {
      currentSection =
        SECTION_BY_LABEL[sectionMatch[1].toLowerCase()] ?? "Main";
      continue;
    }

    const parsingResult = parseDeckEntry(line, currentSection);


    if (!parsingResult) {
      if (line.trim() === "" && !hasExplicitSectionNames) {
        currentSection = "Commander";
      }
    }
    else {
      parsedLines.push(parsingResult);
    }
  }

  const allNames = parsedLines.map(line => line.cardName);

  const cardsCollection = getCollection("scryfall_cards");
  const searchResult = await cardsCollection
    .find(
      {
        normalized_name: {$in: allNames}
      },
      {
        projection: {
          normalized_name: 1,
          oracle_id: 1,
          _id: 0
        }
      }
    )
    .toArray();

  const CardSearchResultSchema = z.array(
    z.object({
      normalized_name: z.array(z.string()),
      oracle_id: z.string()
    }));

  const cardIds = CardSearchResultSchema.parse(searchResult);

  const cardsEntries = cardIds.flatMap(card =>
    (card.normalized_name).map(nName => [nName, card.oracle_id])
  );

  const cardsLookup: Record<string, string> = Object.fromEntries(cardsEntries);

  const resultingDeck: DeckCardCounts = {};

  for (const parsedLine of parsedLines) {
    const oracleId = cardsLookup[parsedLine.cardName];

    if (!oracleId) {
      console.error(`can't find card with name ${parsedLine.cardName}`);
      continue;
      // todo show which cards were not found
    }

    resultingDeck[parsedLine.deckSection] ??= {};
    resultingDeck[parsedLine.deckSection]![oracleId] ??= 0;
    resultingDeck[parsedLine.deckSection]![oracleId] += parsedLine.quantity;

    oracleTagsMap[oracleId] = parsedLine.tags;
  }


  return {resultingDeck, oracleTagsMap};
}