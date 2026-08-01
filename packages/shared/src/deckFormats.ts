import {z} from "zod";
import type {OracleCard} from "./cards.js";
import type {DeckSectionName} from "./repositoryTypes.js";
import {HydratedDeck, HydratedDeckSection} from "./deckTypes.js";
// import {cardCount} from "./deckTypes.js";


export const formats = ["Standard", "Modern", "Commander", "Pauper", "Legacy"] as const;

export const FormatSchema = z.enum(formats);

export type Format = z.infer<typeof FormatSchema>;

/**
 * The maximum amount of the card a deck of the given format can legally have.
 */
export function maximumCardAmount(card: OracleCard, format: Format) {
  if (card.type_line.includes("Basic")) {
    return Infinity;
  }

  else if ((card.card_faces[0].oracle_text ?? "").includes("A deck can have any number of cards named")) {
    return Infinity;
  }

  else if (format !== "Commander") {
    return 4;
  }

  return 1;
}

/**
 * The maximum amount of a card a deck of the given format can legally have.
 * Use only for preflight, as it gets cards like basic lands
 * or cards like Rat colony, which have an uncapped maximum no matter what.
 */
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

export function isLegalDeck(hydratedDeck: HydratedDeck, format: Format) {
  for (const [sn, sectionContent] of Object.entries(hydratedDeck)) {
    const sectionName = sn as DeckSectionName;

    const cardCount = (section: HydratedDeckSection): number =>
      Object.values(section).reduce((sum, c) => sum + c.count, 0);

    const count = cardCount(sectionContent);

    if (
      expectedSectionCardCounts(format)[sectionName as DeckSectionName] !== count
      && !(format === "Commander" && sectionName === "Commander" && count > 0)
    ) {
      return false;
    }

    for (const card of Object.values(sectionContent)) {
      if (card.legalities[format.toLowerCase()] === "not_legal") {
        return false;
      }
    }
  }

  return true;
}