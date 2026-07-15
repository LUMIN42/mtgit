import {CardGroupingMode, CardSortMode, SECTION_SCREEN_SORT_ORDER} from "../types/grouping.ts";
import {
  type HydratedDeck,
  type HydratedDeckSection,
  type DeckSectionName, isMainCardType, MainCardType,
  type ScryfallOracleCard
} from "@mtgit/shared";
import type {TaggedDeckCard} from "@mtgit/shared";
import {MAIN_TYPE_ORDER} from "@mtgit/shared";
import {DeckGroupCardLocation} from "../types/addressedCards.ts";

/**
 * Represents a group of cards with a heading and the associated cards.
 */

export type GroupingResult = SortedSection[];

export type SortedSection = {
  name: DeckSectionName;
  groups: SortedGroup[];
};

export function cardCountSortedGroup(sortedGroup: SortedGroup) {
  return sortedGroup.cards.reduce((prev, current) => prev + current.count, 0);
}

export function cardCountSortedSection(sortedSection: SortedSection) {
  return sortedSection.groups.reduce(
    (prev, current) => prev + cardCountSortedGroup(current),
    0
  );
}

export type SortedGroup = {
  heading: string;
  cards: TaggedDeckCard[];
};

const MANA_VALUE_LANDS_GROUP = "Lands";
const MANA_VALUE_TEN_PLUS_GROUP = "10+";
const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  mythic: 3,
  special: 4,
  bonus: 5
};

/**
 * Parses a Scryfall type line into its main and subtype parts.
 * @param typeLine The type line string from a card.
 * @returns An object with mainPart and subtypePart.
 */
function parseTypeLineParts(typeLine: string): {mainPart: string, subtypePart: string} {
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
  const keys = new Set<MainCardType>();

  for (const word of words) {
    const normalizedWord = toTitleCase(word);

    if (isMainCardType(normalizedWord)) {
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
 * @param card The TaggedDeckCard to analyze.
 * @returns An array of tag group keys.
 */
export function getTagGroupKeys(card: TaggedDeckCard): string[] {
  if (!card.tags?.length) {
    return ["Untagged"];
  }

  return Array.from(new Set(card.tags));
}

export function getGroupHeadingId(groupingMode: CardGroupingMode, deckSection: DeckSectionName, heading: string): string | undefined {
  return `${groupingMode}-${deckSection}-${heading}`;
}

/**
 * Sorts group headings according to the grouping mode (e.g. mana value, type, or alphabetically).
 * @param headings The array of heading strings.
 * @param mode The grouping mode.
 * @returns The sorted array of headings.
 */
export function sortGroupHeadings(headings: string[], mode: CardGroupingMode): string[] {
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
      const leftIndex = MAIN_TYPE_ORDER.findIndex(type => type === left);
      const rightIndex = MAIN_TYPE_ORDER.findIndex(type => type === right);

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
 * @param cards The array of TaggedDeckCard to group.
 * @param mode The grouping mode.
 */
export function groupCardsByMode(cards: TaggedDeckCard[], mode: CardGroupingMode): SortedGroup[] {
  if (mode === "none") {
    return [{heading: "", cards}];
  }

  const groups = new Map<string, TaggedDeckCard[]>();

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

  const sortedHeadings = sortGroupHeadings(Array.from(groups.keys()), mode);

  return sortedHeadings.map(heading => ({
    heading,
    cards: groups.get(heading) ?? []
  }));
}


/**
 * Returns the USD price of a card, or -1 if unavailable or invalid.
 * @param card The TaggedDeckCard to analyze.
 * @returns The price as a number, or -1 if not available.
 */
function getUsdPrice(card: TaggedDeckCard): number {
  const rawUsd = card.prices?.usd;
  if (!rawUsd) {
    return -1;
  }

  const parsedValue = Number.parseFloat(rawUsd);
  return Number.isFinite(parsedValue) ? parsedValue : -1;
}

/**
 * Returns the rarity rank of a card for sorting, or MAX_SAFE_INTEGER if unknown.
 * @param card The TaggedDeckCard to analyze.
 * @returns The rarity rank as a number.
 */
function getRarityRank(card: TaggedDeckCard): number {
  const rarityKey = card.rarity.toLowerCase();
  return RARITY_ORDER[rarityKey] ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Sorts cards within a group according to the selected sort mode (price, mana value, rarity, or name).
 * @param cards The array of TaggedDeckCard to sort.
 * @param mode The sorting mode.
 * @returns The sorted array of cards.
 */
function sortCardsInGroup(cards: TaggedDeckCard[], mode: CardSortMode): TaggedDeckCard[] {
  return [...cards].sort((left, right) => {
    if (mode === "priceUsd") {
      const priceDelta = getUsdPrice(right) - getUsdPrice(left);
      if (priceDelta !== 0) {
        return priceDelta;
      }
    }
    else if (mode === "manaValue") {
      const manaDelta = left.cmc - right.cmc;
      if (manaDelta !== 0) {
        return manaDelta;
      }
    }
    else if (mode === "rarity") {
      const rarityDelta = getRarityRank(right) - getRarityRank(left);
      if (rarityDelta !== 0) {
        return rarityDelta;
      }
    }

    return left.name.localeCompare(right.name);
  });
}

export function handleSection(section: HydratedDeckSection, sectionName: DeckSectionName, groupingMode: CardGroupingMode, sortingMode: CardSortMode): SortedSection {
  const groups = groupCardsByMode(Object.values(section), groupingMode);

  let sortedGroups = groups.map(group => {
    return {
      heading: group.heading,
      cards: sortCardsInGroup(group.cards, sortingMode)
    };
  });

  const headingOrder = sortGroupHeadings(groups.map(group => group.heading), groupingMode);

  sortedGroups = headingOrder.map(heading => sortedGroups.find(group => group.heading == heading));


  return {
    name: sectionName,
    groups: sortedGroups
  };
}

export function performGrouping(deck: HydratedDeck, groupingMode: CardGroupingMode, sortingMode: CardSortMode): GroupingResult {
  const outputSections: SortedSection[] = [];

  for (const sectionName of SECTION_SCREEN_SORT_ORDER) {
    if (sectionName in deck) {
      outputSections.push(handleSection(deck[sectionName], sectionName, groupingMode, sortingMode));
    }
  }

  return outputSections;
}

export function groupCardCount(group: SortedGroup) {
  return group.cards.reduce((sum, card) => sum + card.count, 0);
}

export function sortedSectionCardCount(section: SortedSection) {
  return section.groups.reduce(
    (sum, group) => sum + groupCardCount(group), 0
  );
}

export function flatten(grouping: GroupingResult): DeckGroupCardLocation[] {
  const output: DeckGroupCardLocation[] = [];

  for (const section of grouping) {
    for (const group of section.groups) {
      for (const card of group.cards) {
        output.push({
          oracle_id: card.oracle_id,
          location: {
            "section": section.name,
            "group": group.heading
          }
        });
      }
    }
  }

  return output;
}