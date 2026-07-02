import {z} from "zod";
import {ScryfallOracleCard} from "./scryfall.ts";
import {Format} from "./deckFormats.ts";
import {DeckSectionName} from "./repositoryTypes.ts";


export const MainCardTypes = [
  "Artifact",
  "Battle",
  "Creature",
  "Dungeon",
  "Enchantment",
  "Instant",
  "Land",
  "Planeswalker",
  "Sorcery"
] as const;


export const MainCardTypeSchema = z.enum([
  "Artifact",
  "Battle",
  "Creature",
  "Dungeon",
  "Enchantment",
  "Instant",
  "Land",
  "Planeswalker",
  "Sorcery"
]);

export type MainCardType = z.infer<typeof MainCardTypeSchema>;

export const MAIN_TYPE_ORDER: MainCardType[] = [
  "Artifact",
  "Battle",
  "Creature",
  "Dungeon",
  "Enchantment",
  "Instant",
  "Sorcery",
  "Planeswalker",
  "Land"
];

export const MAIN_TYPE_SET = new Set(MainCardTypes);

export function isMainCardType(value: string): value is MainCardType {
  return MAIN_TYPE_SET.has(value as MainCardType);
}

export function maximumCardAmount(card: ScryfallOracleCard, format: Format) {
  if (card.type_line.includes("Basic")) {
    return Infinity;
  }

  else if ((card.oracle_text ?? "").includes("A deck can have any number of cards named")) {
    return Infinity;
  }

  else if (format !== "Commander") {
    return 4;
  }

  return 1;
}

export function maximumCardAmountWithoutCard(format: Format) {
  if (format === "Commander") {
    return 1;
  }

  return 4;
}

export function relevantSections(format: Format): DeckSectionName[] {
  if (format === "Commander") {
    return ["Main", "Commander"];
  }

  return ["Main", "Sideboard"];
}