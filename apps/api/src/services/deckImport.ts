import { ScryfallOracleCardSchema } from '@mtgit/shared/scryfall';
import type {
  DeckImportDeck,
  DeckImportResult,
  DeckSectionName,
  OracleCardIndex,
  TagsMap,
} from '@mtgit/shared/deckImport';
import type { ScryfallOracleCard } from '@mtgit/shared/scryfall';

import { getMongoService, type MongoService } from '../db/mongo.js';

/**
 * Maps section labels to DeckSectionName values.
 */
const SECTION_BY_LABEL: Record<string, DeckSectionName> = {
  commander: 'Commander',
  main: 'Main',
  sideboard: 'Sideboard',
  considering: 'Considering',
};

/**
 * Normalizes a card name for lookup by lowercasing, trimming, and standardizing split card separators.
 * @param name - The card name to normalize.
 * @returns The normalized card name.
 */
function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\/\/\?\s*/g, ' // ')
    .replace(/\s+/g, ' ')
    .trim();
}

type DeckSections = DeckImportDeck['sections'];

/**
 * Ensures the specified section exists in the deck sections object and returns it.
 * @param sections - The deck sections object.
 * @param section - The section name to ensure.
 * @returns The array of cards for the section.
 */
function ensureSection(sections: DeckSections, section: DeckSectionName): ScryfallOracleCard[] {
  if (section === 'Main') {
    return sections.Main;
  }

  if (!sections[section]) {
    sections[section] = [];
  }

  return sections[section];
}

/**
 * Parses a raw card line for the card name and tags.
 * @param rawName - The raw card line from the decklist.
 * @returns An object containing the card name and an array of tags.
 */
function parseCardNameAndTags(rawName: string): { cardName: string; tags: string[] } {
  const tags = Array.from(rawName.matchAll(/#([^\s#]+)/g), (match) => match[1].toLowerCase());

  const withoutTags = rawName.replace(/\s+#([^\s#]+)/g, '').trim();
  const withoutSetAndCollector = withoutTags
    .replace(/\s+\([^)]+\)\s+\S+(?:\s+\*[^*\s]+\*)*$/u, '')
    .trim();

  return {
    cardName: withoutSetAndCollector,
    tags,
  };
}

/**
 * Builds an index for fast lookup of oracle cards by normalized name.
 * @param cards - The array of ScryfallOracleCard objects.
 * @returns An OracleCardIndex mapping normalized names to cards.
 */
function buildOracleCardIndex(cards: ScryfallOracleCard[]): OracleCardIndex {
  const index: OracleCardIndex = new Map();

  const getLookupPriority = (card: ScryfallOracleCard): number => {
    const isNonPlayableArtLikeCard = card.layout === 'art_series' || card.type_line === 'Card // Card';
    return isNonPlayableArtLikeCard ? 0 : 1;
  };

  const addIndexEntry = (name: string | undefined, card: ScryfallOracleCard) => {
    if (!name) {
      return;
    }

    const key = normalizeCardName(name);
    const current = index.get(key);
    if (!current || getLookupPriority(card) > getLookupPriority(current)) {
      index.set(key, card);
    }
  };

  for (const card of cards) {
    if (card?.name) {
      addIndexEntry(card.name, card);

      if (card.name.includes('//')) {
        for (const splitNamePart of card.name.split(/\s*\/\/\s*/)) {
          addIndexEntry(splitNamePart, card);
        }
      }

      for (const face of card.card_faces ?? []) {
        addIndexEntry(face.name, card);
      }
    }
  }

  return index;
}

/**
 * Parses deck import text into deck sections and tags, using the provided oracle card index.
 * @param importText - The decklist text to import.
 * @param oracleCardIndex - The index of oracle cards for lookup.
 * @returns The parsed DeckImportResult.
 * @throws If any cards are missing from the oracle data.
 */
function parseDeckImportText(importText: string, oracleCardIndex: OracleCardIndex): DeckImportResult {
  const lines = importText.split(/\r?\n/);
  const sectionHeaderPattern = /^(Commander|Main|Sideboard|Considering)\s*:?$/i;
  const hasExplicitSectionHeaders = lines.some((rawLine) => sectionHeaderPattern.test(rawLine.trim()));

  let implicitSideboardStart = -1;
  if (!hasExplicitSectionHeaders) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (lines[index].trim() !== '') {
        continue;
      }

      const trailingCardLines = lines
        .slice(index + 1)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('//') && !line.startsWith('#'));

      if (trailingCardLines.length === 1) {
        implicitSideboardStart = index + 1;
      }

      break;
    }
  }

  const sections: DeckSections = { Main: [] };
  let currentSection: DeckSectionName = 'Main';
  const missingCards = new Set<string>();
  const tagsMap: TagsMap = {};

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();

    if (!hasExplicitSectionHeaders && implicitSideboardStart >= 0 && index >= implicitSideboardStart) {
      currentSection = 'Sideboard';
    }

    if (!line || line.startsWith('//') || line.startsWith('#')) {
      continue;
    }

    const sectionMatch = line.match(sectionHeaderPattern);
    if (sectionMatch) {
      currentSection = SECTION_BY_LABEL[sectionMatch[1].toLowerCase()];
      continue;
    }

    const quantityMatch = line.match(/^(\d+)\s*x?\s+(.+)$/i);
    const quantity = quantityMatch ? Number.parseInt(quantityMatch[1], 10) : 1;
    const rawName = quantityMatch ? quantityMatch[2] : line;
    const entryText = rawName.replace(/^[*-]\s*/, '').trim();
    const {cardName, tags} = parseCardNameAndTags(entryText);
    const card = oracleCardIndex.get(normalizeCardName(cardName));

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

    const targetSection = ensureSection(sections, currentSection);
    for (let i = 0; i < quantity; i += 1) {
      targetSection.push({ ...card });
    }
  }

  function isLegendaryCreature(card: ScryfallOracleCard): boolean {
    const typeLine = card.type_line.toLowerCase();
    return typeLine.includes('legendary') && typeLine.includes('creature');
  }

  function promoteCardToCommander(sectionCards: ScryfallOracleCard[], index: number): void {
    const commander = sectionCards[index];
    if (!commander) {
      return;
    }

    sectionCards.splice(index, 1);
    ensureSection(sections, 'Commander').push(commander);
  }

  if (!sections.Commander?.length && sections.Sideboard?.length === 1 && isLegendaryCreature(sections.Sideboard[0])) {
    promoteCardToCommander(sections.Sideboard, 0);
  }

  if (missingCards.size > 0) {
    const missingList = Array.from(missingCards).slice(0, 8).join(', ');
    const suffix = missingCards.size > 8 ? '...' : '';
    throw new Error(`Could not find these cards in oracle data: ${missingList}${suffix}`);
  }

  return {
    deck: {
      name: 'Imported Deck',
      sections,
    },
    tagsMap,
  };
}

/**
 * Service for importing decks, parsing decklists, and resolving card data from the database.
 */
export class DeckImportService {
  private oracleCardIndexPromise: Promise<OracleCardIndex> | null = null;
  private readonly mongoService: MongoService;

  /**
   * Constructs a DeckImportService.
   * @param mongoService - The MongoService instance for database access.
   */
  constructor(mongoService: MongoService) {
    this.mongoService = mongoService;
  }

  /**
   * Parses deck import text, resolving card data from the database.
   * @param importText - The decklist text to import.
   * @returns The parsed DeckImportResult.
   */
  async parseDeckImportText(importText: string): Promise<DeckImportResult> {
    const oracleCardIndex = await this.getOracleCardIndex();
    return parseDeckImportText(importText, oracleCardIndex);
  }

  /**
   * Gets or builds the oracle card index from the database.
   * @returns The OracleCardIndex.
   */
  private async getOracleCardIndex(): Promise<OracleCardIndex> {
    if (!this.oracleCardIndexPromise) {
      this.oracleCardIndexPromise = this.buildOracleCardIndex().catch((error) => {
        this.oracleCardIndexPromise = null;
        throw error;
      });
    }

    return this.oracleCardIndexPromise;
  }

  /**
   * Loads all oracle cards from the database and builds the lookup index.
   * @returns The OracleCardIndex.
   * @throws If any card documents are invalid or missing.
   */
  private async buildOracleCardIndex(): Promise<OracleCardIndex> {
    const collection = this.mongoService.getCollection('scryfall_cards');
    const rawCards = await collection.find({}).toArray();

    const cards: ScryfallOracleCard[] = [];
    for (const [index, rawCard] of rawCards.entries()) {
      const parsed = ScryfallOracleCardSchema.safeParse(rawCard);
      if (!parsed.success) {
        throw new Error(`Invalid oracle card document at index ${index}.`);
      }

      cards.push(parsed.data);
    }

    if (cards.length === 0) {
      throw new Error('Oracle cards data is empty or invalid.');
    }

    return buildOracleCardIndex(cards);
  }
}

/**
 * Gets a DeckImportService instance with a connected MongoService.
 * @returns A promise resolving to a DeckImportService.
 */
export async function getDeckImportService(): Promise<DeckImportService> {
  const mongoService = await getMongoService();
  return new DeckImportService(mongoService);
}
