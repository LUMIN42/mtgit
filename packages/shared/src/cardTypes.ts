import {z} from "zod";
import {ColorCode} from "./scryfall.ts";


export const MAIN_CARD_TYPES = [
  "Artifact",
  "Battle",
  "Creature",
  "Enchantment",
  "Instant",
  "Land",
  "Planeswalker",
  "Sorcery"
] as const;


export const MainCardTypeSchema = z.enum(MAIN_CARD_TYPES);

export type MainCardType = z.infer<typeof MainCardTypeSchema>;

export const MAIN_TYPE_ORDER: MainCardType[] = [
  "Artifact",
  "Battle",
  "Creature",
  "Enchantment",
  "Instant",
  "Sorcery",
  "Planeswalker",
  "Land"
];

export const MAIN_TYPE_SET = new Set(MAIN_CARD_TYPES);

export function isMainCardType(value: string): value is MainCardType {
  return MAIN_TYPE_SET.has(value as MainCardType);
}

export function mainTypes(typeLine: string): Set<MainCardType> {
  const output = new Set<MainCardType>();

  for (const mainCardType of MAIN_CARD_TYPES) {
    if (typeLine.includes(mainCardType)) {
      output.add(mainCardType);
    }
  }

  return output;
}

export const COLOR_NAMES: Record<ColorCode, string> = {
  B: "Black",
  W: "White",
  U: "Blue",
  R: "Red",
  G: "Green"
} as const;