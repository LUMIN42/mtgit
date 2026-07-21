import {z} from "zod";
import {ColorCode} from "./scryfall.js";


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

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const COLOR_NAMES = ["Black", "White", "Blue", "Red", "Green", "Colorless"] as const;
export const ColorNameSchema = z.preprocess(
  raw => {
    if (typeof raw === "string") {
      return capitalize(raw);
    }
    return raw;
  },
  z.enum(COLOR_NAMES)
);


export type ColorName = z.infer<typeof ColorNameSchema>;

export const COLOR_CODE_TO_NAMES: Record<ColorCode, ColorName> = {
  B: "Black",
  W: "White",
  U: "Blue",
  R: "Red",
  G: "Green",
  C: "Colorless"
} as const;

export const COLOR_NAME_TO_CODE: Record<ColorName, ColorCode> = {
  Black: "B",
  White: "W",
  Blue: "U",
  Red: "R",
  Green: "G",
  Colorless: "C"
} as const;