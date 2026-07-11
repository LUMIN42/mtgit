import {DeckSectionName} from "@mtgit/shared";

export type CardGroupingMode = "none" | "type" | "manaValue" | "tags";

export type CardSortMode = "name" | "priceUsd" | "manaValue" | "rarity";

export const SECTION_SCREEN_SORT_ORDER: DeckSectionName[] =
  ["Commander", "Main", "Sideboard"];