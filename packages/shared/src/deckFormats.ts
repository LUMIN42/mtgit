import {z} from "zod";
import {ScryfallOracleCard} from "./scryfall.js";
import {DeckSectionName} from "./repositoryTypes.js";


export const formats = ["Standard", "Modern", "Commander", "Pauper"] as const;

export const FormatSchema = z.enum(formats);

export type Format = z.infer<typeof FormatSchema>;

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

export function expectedSectionCardCounts(format: Format): Partial<Record<DeckSectionName, number>> {
  if (format === "Commander") {
    return {
      "Main": 99
    };
  }

  return {
    "Main": 60,
    "Sideboard": 15
  };
}

export function relevantSections(format: Format): DeckSectionName[] {
  if (format === "Commander") {
    return ["Main", "Commander"];
  }

  return ["Main", "Sideboard"];
}