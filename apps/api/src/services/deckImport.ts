import {ScryfallOracleCardSchema, Deck, SECTION_BY_LABEL, DeckSection, withTags} from "@mtgit/shared";
import type {DeckSectionName, TaggedDeck, TagsMap} from "@mtgit/shared";
import type {ScryfallOracleCard} from "@mtgit/shared/scryfall";

import {getCollection} from "../db/mongo.js";

/**
 * Normalizes a card name for lookup by lowercasing, trimming, and standardizing split card separators.
 * @param name - The card name to normalize.
 * @returns The normalized card name.
 */
function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\/\/?\s*/g, " // ") // fire//ice → fire // ice
    .replace(/\s+/g, " ") // normalize whitespaces to a single space
    .trim();
}

type DeckSections = Deck["sections"];
type ParsedDeckEntry = {
  quantity: number;
  cardName: string;
  tags: string[];
};

/**
 * Ensures the specified section exists in the deck sections object and returns it.
 *
 * Analogous to c++ my_map[] = x operator.
 *
 * @param sections - The deck sections object.
 * @param section - The section name to ensure.
 * @returns The DeckSection
 */
function safeGetSection(sections: DeckSections, section: DeckSectionName): DeckSection {
  if (!sections[section]) {
    sections[section] = new DeckSection(section);
  }
  
  return sections[section];
}

/**
 * Parses a deck entry line into quantity, card name, and tags.
 *
 * Supports optional quantity prefixes like "3 Lightning Bolt" and "1x Lightning Bolt".
 * If no quantity prefix is present, quantity defaults to 1.
 *
 * @param rawLine - The raw card entry line from the decklist.
 * @returns Parsed quantity, normalized card name text, and extracted tags.
 */
function parseDeckEntry(rawLine: string): ParsedDeckEntry {
  const lineRegex = /(\d+) ([^#(]+)(.*)?/; // amount, card name, rest of line
  // rest of line may include set code, collector number and tags
  
  const match = rawLine.match(lineRegex);
  
  if (!match) {
    throw new Error("No match");
  }
  
  const [, rawAmount, rawCardName, rest] = match;
  const cardName = rawCardName.trim();
  
  
  const quantity = Number.parseInt(rawAmount);
  
  const tags = [];
  
  const tagsRegex = /#([A-Za-z0-9 ]+)/g;
  if (rest) {
    const tagMatches = rest.matchAll(tagsRegex);
    
    for (const tagMatch of tagMatches) {
      tags.push(tagMatch[1].trim());
    }
  }
  
  return {
    quantity,
    cardName,
    tags
  };
}

/**
 * Looks up a single card from the scryfall_cards collection by normalized name.
 * Prioritizes playable cards over art-series cards.
 * @param normalizedName - The normalized card name to lookup.
 * @returns The card, or undefined if not found.
 */
async function lookupCardByNormalizedName(
  normalizedName: string
): Promise<ScryfallOracleCard | undefined> {
  const scryfallCards = getCollection("scryfall_cards");
  const cards = await scryfallCards
    .find({normalized_name: normalizedName})
    .toArray() as unknown[];
  
  if (cards.length === 0) {
    return undefined;
  }
  
  // Parse and prioritize: prefer non-art-series cards
  const parsedCards: ScryfallOracleCard[] = [];
  for (const rawCard of cards) {
    const parsed = ScryfallOracleCardSchema.safeParse(rawCard);
    if (parsed.success) {
      parsedCards.push(parsed.data);
    }
  }
  
  if (parsedCards.length === 0) {
    return undefined;
  }
  
  // Sort by priority: art-series and "Card // Card" are lower priority
  parsedCards.sort((a, b) => {
    const aIsArtLike = a.layout === "art_series" || a.type_line === "Card // Card" ? 0 : 1;
    const bIsArtLike = b.layout === "art_series" || b.type_line === "Card // Card" ? 0 : 1;
    return bIsArtLike - aIsArtLike;
  });
  
  return parsedCards[0];
}

/**
 * Finds the start index of an implicit sideboard section in a decklist without explicit section headers.
 *
 * The function scans from the end of the decklist upwards, looking for the first blank line.
 * If exactly one non-comment, non-blank card line follows that blank line, it is treated as the start of the sideboard.
 *
 * @param lines - The decklist lines (already split and trimmed).
 * @returns The index where the implicit sideboard starts, or -1 if not found.
 */
function findImplicitSideboardStart(lines: string[]): number {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].trim() !== "") {
      continue;
    }
    
    const trailingCardLines = lines
      .slice(index + 1)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("//") && !line.startsWith("#"));
    
    if (trailingCardLines.length === 1) {
      return index + 1;
    }
    
    break;
  }
  return -1;
}

/**
 * Parses deck import text into deck sections and tags, querying the scryfall_cards collection.
 * @param importText - The raw imported decklist from the textarea.
 * @returns The parsed DeckImportResult.
 * @throws If any cards are missing from the oracle data.
 */
export async function parseDeckImportText(importText: string): Promise<TaggedDeck> {
  const lines = importText.split(/\r?\n/);
  const sectionHeaderPattern = /^(Commander|Main|Sideboard|Considering)\s*:?$/i;
  const hasExplicitSectionHeaders = lines.some(rawLine => sectionHeaderPattern.test(rawLine.trim()));
  
  let implicitSideboardStart = -1;
  if (!hasExplicitSectionHeaders) {
    implicitSideboardStart = findImplicitSideboardStart(lines);
  }
  
  const sections: DeckSections = {Main: new DeckSection("Main")};
  let currentSection: DeckSectionName = "Main";
  const missingCards = new Set<string>();
  const tagsMap: TagsMap = {};
  
  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    
    if (!hasExplicitSectionHeaders && implicitSideboardStart >= 0 && index >= implicitSideboardStart) {
      currentSection = "Sideboard";
    }
    
    if (!line || line.startsWith("//") || line.startsWith("#")) {
      continue;
    }
    
    const sectionMatch = line.match(sectionHeaderPattern);
    if (sectionMatch) {
      currentSection = SECTION_BY_LABEL[sectionMatch[1].toLowerCase()];
      continue;
    }
    
    const {quantity, cardName, tags} = parseDeckEntry(line);
    
    if (cardName === "Glasswing Grace / Age-Graced Chapel") {
      console.log("found him!");
    }
    
    const card = await lookupCardByNormalizedName(normalizeCardName(cardName));
    
    if (!card) {
      missingCards.add(cardName);
      continue;
    }
    
    if (tags.length > 0) {
      const cardId = card.oracle_id || card.id;
      if (cardId) {
        if (!tagsMap[cardId]) {
          tagsMap[cardId] = [];
        }
        
        tagsMap[cardId].push(...tags);
        tagsMap[cardId] = Array.from(new Set(tagsMap[cardId]));
      }
    }
    
    const targetSection = safeGetSection(sections, currentSection);
    for (let i = 0; i < quantity; i += 1) {
      const cardWithCount = {
        ...card,
        count: 1
      };
      targetSection.addCard(cardWithCount);
    }
  }
  
  function isLegendaryCreature(card: ScryfallOracleCard): boolean {
    const typeLine = card.type_line.toLowerCase();
    return typeLine.includes("legendary") && typeLine.includes("creature");
  }
  
  function promoteCardToCommander(sourceSection: DeckSection, cardOracleId: string): void {
    const commander = sourceSection.getById(cardOracleId);
    if (!commander) {
      return;
    }
    
    sourceSection.removeById(cardOracleId);
    safeGetSection(sections, "Commander").addCard(commander);
  }
  
  if (!sections.Commander?.length && sections.Sideboard?.length === 1) {
    const sideboardCard = sections.Sideboard.toArray()[0];
    if (sideboardCard && isLegendaryCreature(sideboardCard)) {
      const cardOracleId = sideboardCard.oracle_id;
      if (cardOracleId) {
        promoteCardToCommander(sections.Sideboard, cardOracleId);
      }
    }
  }
  
  if (missingCards.size > 0) {
    const missingList = Array.from(missingCards).slice(0, 8).join(", ");
    const suffix = missingCards.size > 8 ? "..." : "";
    throw new Error(`Could not find these cards in oracle data: ${missingList}${suffix}`);
  }
  
  return withTags(new Deck("Imported Deck", sections), tagsMap);
}

// The deck parser is now exposed as a plain function so callers can inject the
// Mongo adapter directly at the boundary where composition happens.
