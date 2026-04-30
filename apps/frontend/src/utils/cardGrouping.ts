import type {CardGroupingMode, CardSortMode} from "../types/grouping.ts";
import type {CardWithTags} from "../types/cardWithTags.ts";
import type {ScryfallOracleCard} from "@mtgit/shared";

/**
 * Represents a group of cards with a heading and the associated cards.
 */
export type GroupedCards = {
  heading: string;
  cards: CardWithTags[];
};

// todo move to proper global types
export const MainCardType = {
  Artifact: "Artifact",
  Battle: "Battle",
  Creature: "Creature",
  Dungeon: "Dungeon",
  Enchantment: "Enchantment",
  Instant: "Instant",
  Land: "Land",
  Planeswalker: "Planeswalker",
  Sorcery: "Sorcery"
} as const;

export type MainCardType = (typeof MainCardType)[keyof typeof MainCardType];

// todo just sort alphabetically ?
const MAIN_TYPE_ORDER: MainCardType[] = [
  MainCardType.Artifact,
  MainCardType.Battle,
  MainCardType.Creature,
  MainCardType.Dungeon,
  MainCardType.Enchantment,
  MainCardType.Instant,
  MainCardType.Sorcery,
  MainCardType.Planeswalker,
  MainCardType.Land
];

const MAIN_TYPE_SET = new Set<string>(MAIN_TYPE_ORDER);
const MANA_VALUE_LANDS_GROUP = "Lands";
const MANA_VALUE_TEN_PLUS_GROUP = "10+";
const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  mythic: 3,
  special: 4,
  bonus: 5,
};

/**
 * Parses a Scryfall type line into its main and subtype parts.
 * @param typeLine The type line string from a card.
 * @returns An object with mainPart and subtypePart.
 */
function parseTypeLineParts(typeLine: string): { mainPart: string; subtypePart: string } {
  const [mainPart = "", subtypePart = ""] = typeLine.split(/\s[-—]\s/, 2);
  return {mainPart, subtypePart};
}

/**
 * Converts a word to title case (first letter uppercase, rest lowercase).
 * @param word The word to convert.
 * @returns The word in title case.
 */
function toTitleCase(word: string): string {
  return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Returns the main type group keys for a Scryfall card, e.g. ["Artifact", "Creature"].
 * @param card The ScryfallOracleCard to analyze.
 * @returns An array of type group keys, or ["Other"] if none found.
 */
export function getTypeGroupKeys(card: ScryfallOracleCard): string[] {
  const {mainPart} = parseTypeLineParts(card.type_line);
  const words = mainPart.match(/[A-Za-z]+/g) ?? [];
  const keys = new Set<string>();

  for (const word of words) {
    const normalizedWord = toTitleCase(word);
    if (MAIN_TYPE_SET.has(normalizedWord)) {
      keys.add(normalizedWord);
    }
  }

  return keys.size > 0 ? Array.from(keys) : ["Other"];
}

/**
 * Returns the mana value group key for a card (e.g. "2", "10+", or "Lands").
 * @param card The ScryfallOracleCard to analyze.
 * @returns The group key as a string.
 */
export function getManaValueGroupKey(card: ScryfallOracleCard): string {
  if (card.type_line.toLowerCase().includes("land")) {
    return MANA_VALUE_LANDS_GROUP;
  }

  const manaValue = Math.floor(card.cmc);
  return manaValue >= 10 ? MANA_VALUE_TEN_PLUS_GROUP : `${manaValue}`;
}

/**
 * Returns the tag group keys for a card, or ["Untagged"] if none.
 * @param card The CardWithTags to analyze.
 * @returns An array of tag group keys.
 */
export function getTagGroupKeys(card: CardWithTags): string[] {
  if (!card.tags?.length) {
    return ["Untagged"];
  }

  return Array.from(new Set(card.tags));
}

/**
 * Returns a unique HTML id for a group heading, if needed for accessibility.
 * @param groupingMode The grouping mode (e.g. "manaValue").
 * @param heading The heading string.
 * @returns The id string or undefined.
 */
export function getGroupHeadingId(groupingMode: CardGroupingMode, heading: string): string | undefined {
  if (groupingMode === "manaValue") {
    return `mana-value-heading-${heading.replace(/\+/g, "plus")}`;
  }

  return undefined;
}

/**
 * Sorts group headings according to the grouping mode (e.g. mana value, type, or alphabetically).
 * @param headings The array of heading strings.
 * @param mode The grouping mode.
 * @returns The sorted array of headings.
 */
function sortGroupedHeadings(headings: string[], mode: CardGroupingMode): string[] {
  return headings.sort((left, right) => {
    if (mode === "manaValue") {
      if (left === MANA_VALUE_LANDS_GROUP) {
        return 1;
      }

      if (right === MANA_VALUE_LANDS_GROUP) {
        return -1;
      }

      const leftValue = left === MANA_VALUE_TEN_PLUS_GROUP ? 10 : Number.parseInt(left, 10);
      const rightValue = right === MANA_VALUE_TEN_PLUS_GROUP ? 10 : Number.parseInt(right, 10);
      return leftValue - rightValue;
    }

    if (mode === "type") {
      const leftIndex = MAIN_TYPE_ORDER.findIndex((type) => type === left);
      const rightIndex = MAIN_TYPE_ORDER.findIndex((type) => type === right);

      if (leftIndex >= 0 && rightIndex >= 0) {
        return leftIndex - rightIndex;
      }

      if (leftIndex >= 0) {
        return -1;
      }

      if (rightIndex >= 0) {
        return 1;
      }
    }

    return left.localeCompare(right);
  });
}

/**
 * Groups cards by the selected grouping mode (type, mana value, tag, or none).
 * @param cards The array of CardWithTags to group.
 * @param mode The grouping mode.
 * @returns An array of GroupedCards objects.
 */
export function groupCardsByMode(cards: CardWithTags[], mode: CardGroupingMode): GroupedCards[] {
  if (mode === "none") {
    return [{heading: "", cards}];
  }

  const groups = new Map<string, CardWithTags[]>();

  for (const card of cards) {
    const keys =
      mode === "type"
        ? getTypeGroupKeys(card)
        : mode === "manaValue"
          ? [getManaValueGroupKey(card)]
          : getTagGroupKeys(card);

    for (const key of keys) {
      const currentCards = groups.get(key) ?? [];
      currentCards.push(card);
      groups.set(key, currentCards);
    }
  }

  const sortedHeadings = sortGroupedHeadings(Array.from(groups.keys()), mode);

  return sortedHeadings.map((heading) => ({
    heading,
    cards: groups.get(heading) ?? [],
  }));
}

/**
 * Returns the USD price of a card, or -1 if unavailable or invalid.
 * @param card The CardWithTags to analyze.
 * @returns The price as a number, or -1 if not available.
 */
function getUsdPrice(card: CardWithTags): number {
  const rawUsd = card.prices?.usd;
  if (!rawUsd) {
    return -1;
  }

  const parsedValue = Number.parseFloat(rawUsd);
  return Number.isFinite(parsedValue) ? parsedValue : -1;
}

/**
 * Returns the rarity rank of a card for sorting, or MAX_SAFE_INTEGER if unknown.
 * @param card The CardWithTags to analyze.
 * @returns The rarity rank as a number.
 */
function getRarityRank(card: CardWithTags): number {
  const rarityKey = card.rarity.toLowerCase();
  return RARITY_ORDER[rarityKey] ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Sorts cards within a group according to the selected sort mode (price, mana value, rarity, or name).
 * @param cards The array of CardWithTags to sort.
 * @param mode The sorting mode.
 * @returns The sorted array of cards.
 */
export function sortCardsInGroup(cards: CardWithTags[], mode: CardSortMode): CardWithTags[] {
  return [...cards].sort((left, right) => {
    if (mode === "priceUsd") {
      const priceDelta = getUsdPrice(right) - getUsdPrice(left);
      if (priceDelta !== 0) {
        return priceDelta;
      }
    } else if (mode === "manaValue") {
      const manaDelta = left.cmc - right.cmc;
      if (manaDelta !== 0) {
        return manaDelta;
      }
    } else if (mode === "rarity") {
      const rarityDelta = getRarityRank(right) - getRarityRank(left);
      if (rarityDelta !== 0) {
        return rarityDelta;
      }
    }

    return left.name.localeCompare(right.name);
  });
}
