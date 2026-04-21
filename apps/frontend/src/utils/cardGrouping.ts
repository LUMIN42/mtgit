import type {CardGroupingMode, CardSortMode} from "../types/grouping.ts";
import type {CardWithTags} from "../types/cardWithTags.ts";
import type {ScryfallOracleCard} from "@mtgit/shared";

export type GroupedCards = {
  heading: string;
  cards: CardWithTags[];
};

export const MainCardType = {
  Artifact: "Artifact",
  Battle: "Battle",
  Creature: "Creature",
  Dungeon: "Dungeon",
  Enchantment: "Enchantment",
  Instant: "Instant",
  Land: "Land",
  Planeswalker: "Planeswalker",
} as const;

export type MainCardType = (typeof MainCardType)[keyof typeof MainCardType];

const MAIN_TYPE_ORDER: MainCardType[] = [
  MainCardType.Artifact,
  MainCardType.Battle,
  MainCardType.Creature,
  MainCardType.Dungeon,
  MainCardType.Enchantment,
  MainCardType.Instant,
  MainCardType.Land,
  MainCardType.Planeswalker,
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

function parseTypeLineParts(typeLine: string): { mainPart: string; subtypePart: string } {
  const [mainPart = "", subtypePart = ""] = typeLine.split(/\s[-—]\s/, 2);
  return {mainPart, subtypePart};
}

function toTitleCase(word: string): string {
  return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
}

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

export function getManaValueGroupKey(card: ScryfallOracleCard): string {
  if (card.type_line.toLowerCase().includes("land")) {
    return MANA_VALUE_LANDS_GROUP;
  }

  const manaValue = Math.floor(card.cmc);
  return manaValue >= 10 ? MANA_VALUE_TEN_PLUS_GROUP : `${manaValue}`;
}

export function getTagGroupKeys(card: CardWithTags): string[] {
  if (!card.tags?.length) {
    return ["Untagged"];
  }

  return Array.from(new Set(card.tags));
}

export function getGroupHeadingId(groupingMode: CardGroupingMode, heading: string): string | undefined {
  if (groupingMode === "manaValue") {
    return `mana-value-heading-${heading.replace(/\+/g, "plus")}`;
  }

  return undefined;
}

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

function getUsdPrice(card: CardWithTags): number {
  const rawUsd = card.prices?.usd;
  if (!rawUsd) {
    return -1;
  }

  const parsedValue = Number.parseFloat(rawUsd);
  return Number.isFinite(parsedValue) ? parsedValue : -1;
}

function getRarityRank(card: CardWithTags): number {
  const rarityKey = card.rarity.toLowerCase();
  return RARITY_ORDER[rarityKey] ?? Number.MAX_SAFE_INTEGER;
}

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




