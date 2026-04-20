import type {Deck, DeckSectionName} from "../types/deck.ts";
import type {CardWithTags} from "../types/cardWithTags.ts";
import type {ScryfallOracleCard} from "../types/scryfall.ts";
import type {TagsMap} from "../context/TagsContext.tsx";

export type OracleCardIndex = Map<string, ScryfallOracleCard>;

const SECTION_BY_LABEL: Record<string, DeckSectionName> = {
  commander: "Commander",
  main: "Main",
  sideboard: "Sideboard",
  considering: "Considering",
};

function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\/\/?\s*/g, " // ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureSection(sections: Deck["sections"], section: DeckSectionName): ScryfallOracleCard[] {
  if (section === "Main") {
    return sections.Main;
  }

  if (!sections[section]) {
    sections[section] = [];
  }

  return sections[section];
}

function parseCardNameAndTags(rawName: string): { cardName: string; tags: string[] } {
  const tags = Array.from(rawName.matchAll(/#([^\s#]+)/g), (match) => match[1].toLowerCase());

  const withoutTags = rawName.replace(/\s+#([^\s#]+)/g, "").trim();
  const withoutSetAndCollector = withoutTags
    .replace(/\s+\([^)]+\)\s+\S+(?:\s+\*[^*\s]+\*)*$/u, "")
    .trim();

  return {
    cardName: withoutSetAndCollector,
    tags,
  };
}

function isLegendaryCreature(card: ScryfallOracleCard): boolean {
  const typeLine = card.type_line.toLowerCase();
  return typeLine.includes("legendary") && typeLine.includes("creature");
}

function promoteCardToCommander(sections: Deck["sections"], sectionCards: CardWithTags[], index: number): void {
  const commander = sectionCards[index];
  if (!commander) {
    return;
  }

  sectionCards.splice(index, 1);
  ensureSection(sections, "Commander").push(commander);
}

export function extractCardsFromOracleJson(payload: unknown): ScryfallOracleCard[] {
  if (Array.isArray(payload)) {
    return payload as ScryfallOracleCard[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as {data?: unknown[]}).data)) {
    return (payload as {data: ScryfallOracleCard[]}).data;
  }

  return [];
}

export function buildOracleCardIndex(cards: ScryfallOracleCard[]): OracleCardIndex {
  const index: OracleCardIndex = new Map();

  const getLookupPriority = (card: ScryfallOracleCard): number => {
    const isNonPlayableArtLikeCard = card.layout === "art_series" || card.type_line === "Card // Card";
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

      if (card.name.includes("//")) {
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

export function parseDeckImportText(importText: string, oracleCardIndex: OracleCardIndex): { deck: Deck; tagsMap: TagsMap } {
  const lines = importText.split(/\r?\n/);
  const sectionHeaderPattern = /^(Commander|Main|Sideboard|Considering)\s*:?$/i;
  const hasExplicitSectionHeaders = lines.some((rawLine) => sectionHeaderPattern.test(rawLine.trim()));

  let implicitSideboardStart = -1;
  if (!hasExplicitSectionHeaders) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (lines[index].trim() !== "") {
        continue;
      }

      const trailingCardLines = lines
        .slice(index + 1)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("//") && !line.startsWith("#"));

      if (trailingCardLines.length === 1) {
        implicitSideboardStart = index + 1;
      }

      break;
    }
  }

  const sections: Deck["sections"] = {Main: []};
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

    const quantityMatch = line.match(/^(\d+)\s*x?\s+(.+)$/i);
    const quantity = quantityMatch ? Number.parseInt(quantityMatch[1], 10) : 1;
    const rawName = quantityMatch ? quantityMatch[2] : line;
    const entryText = rawName.replace(/^[*-]\s*/, "").trim();
    const {cardName, tags} = parseCardNameAndTags(entryText);
    const card = oracleCardIndex.get(normalizeCardName(cardName));

    if (!card) {
      missingCards.add(cardName);
      continue;
    }

    // Add tags to tagsMap by card id (oracle_id preferred, fallback to id)
    if (tags.length > 0) {
      const cardId = card.oracle_id || card.id;
      if (cardId) {
        if (!tagsMap[cardId]) tagsMap[cardId] = [];
        tagsMap[cardId].push(...tags);
        // Remove duplicates
        tagsMap[cardId] = Array.from(new Set(tagsMap[cardId]));
      }
    }

    const targetSection = ensureSection(sections, currentSection);
    for (let i = 0; i < quantity; i += 1) {
      targetSection.push({...card});
    }
  }

  if (!sections.Commander?.length && sections.Sideboard?.length === 1 && isLegendaryCreature(sections.Sideboard[0])) {
    promoteCardToCommander(sections, sections.Sideboard, 0);
  }


  if (missingCards.size > 0) {
    const missingList = Array.from(missingCards).slice(0, 8).join(", ");
    const suffix = missingCards.size > 8 ? "..." : "";
    throw new Error(`Could not find these cards in oracle data: ${missingList}${suffix}`);
  }

  return {
    deck: {
      name: "Imported Deck",
      sections,
    },
    tagsMap,
  };
}
