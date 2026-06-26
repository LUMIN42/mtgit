import {z} from "zod";


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