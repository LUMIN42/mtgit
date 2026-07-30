/**
 * {@link deckToExportText} is the only function you should probably be using
 */

import {DeckCard, HydratedDeck, HydratedDeckSection} from "./deckTypes.js";
import {DECK_SECTION_NAMES, DeckSectionName} from "./repositoryTypes.js";

export const DECK_EXPORT_MODES = ["Arena", "MTGO"] as const;
export type DeckExportMode = (typeof DECK_EXPORT_MODES)[number];

const ARENA_DECK_SECTION_TRANSLATOR = {
  ...Object.fromEntries(DECK_SECTION_NAMES.map((name: DeckSectionName) => [name, name])),
  Main: "Deck"
} as Record<DeckSectionName, string>;

/**
 * same for both MTGO and MTGA
 */
function serializeCard(card: DeckCard) {
  return `${card.count} ${card.name}`;
}

/**
 * same for both MTGO and MTGA
 */
function serializeSectionContent(section: HydratedDeckSection) {
  return Object.values(section).map(serializeCard).join("\n");
}

function serializeArenaSection(section: HydratedDeckSection, sectionName: string) {
  return `
${ARENA_DECK_SECTION_TRANSLATOR[sectionName as DeckSectionName]}
${serializeSectionContent(section)}
`.trim();
}

// todo brawl decks
function toArenaText(deck: HydratedDeck, deckName: string) {
  return `
About
Name ${deckName}

${Object.entries(deck)
  .map(([sectionName, sectionContent]) =>
    serializeArenaSection(sectionContent, sectionName)
  )
  .join("\n\n")}
`.trim();
}

function toMtgoText(deck: HydratedDeck) {
  let output = serializeSectionContent(deck.Main ?? {});

  if ("Sideboard" in deck) {
    output = `
${output}

SIDEBOARD:
${serializeSectionContent(deck.Sideboard!)}
`.trim();
  }

  if ("Commander" in deck) {
    output = `
${output}

${serializeSectionContent(deck.Commander!)}
`.trim();
  }

  return output;
}

/**
 * Serializes a deck into either MTGO or MTGA import/export plaintext format.
 */
export function deckToExportText(
  deck: HydratedDeck,
  mode: DeckExportMode,
  deckName: string
) {
  switch (mode) {
    case "Arena":
      return toArenaText(deck, deckName);

    case "MTGO":
      return toMtgoText(deck);

    default: {
      const _exhaustiveCheck: never = mode;
      return _exhaustiveCheck;
    }
  }
}