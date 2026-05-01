// Deck-related shared types.

import {z} from "zod";
import {ScryfallOracleCardSchema} from "./scryfall.js";
import type {ScryfallOracleCard} from "./scryfall.js";

export type TagsMap = Record<string, string[]>;


export const DECK_SECTION_NAMES = ["Main", "Commander", "Sideboard", "Considering"] as const;
export type DeckSectionName = typeof DECK_SECTION_NAMES[number];

/**
 * Maps section labels (as they appear in decklists) to their canonical DeckSectionName.
 */
export const SECTION_BY_LABEL: Record<string, DeckSectionName> =
  Object.fromEntries(
    DECK_SECTION_NAMES.map(name => [name.toLowerCase(), name])
  );

// Card with count property, count is part of the card object itself
export interface DeckCard extends ScryfallOracleCard {
  count: number;
}

// Zod schemas to validate and hydrate deck data into Deck/DeckSection instances
const DeckCardSchema = ScryfallOracleCardSchema.extend({
  count: z.number().int().default(1)
});

const RawSectionItemSchema = z.union([
  DeckCardSchema.array(),
  z.record(z.string(), DeckCardSchema)
]);

const RawSectionsSchema = z.record(z.string(), RawSectionItemSchema).optional().transform(raw => {
  const sections: Partial<Record<DeckSectionName, DeckSection>> = {};
  
  for (const canonical of DECK_SECTION_NAMES) {
    const item = raw?.[canonical as string];
    if (item == null) {
      continue;
    }
    
    if (Array.isArray(item)) {
      sections[canonical] = new DeckSection(canonical, item as DeckCard[]);
    }
    else {
      // record map oracleId -> DeckCard
      sections[canonical] = new DeckSection(canonical, item as Record<OracleId, DeckCard>);
    }
  }
  
  // ensure Main exists
  if (!sections.Main) {
    sections.Main = new DeckSection("Main");
  }
  
  return sections as DeckSections;
});

const DeckSchema = z.object({
  name: z.string().optional(),
  sections: RawSectionsSchema
}).transform(raw => {
  const name = raw.name ?? "Imported Deck";
  // RawSectionsSchema already converts present sections into DeckSection instances
  const sections = (raw.sections ?? {}) as DeckSections;
  
  // Guarantee Main exists
  if (!sections.Main) {
    sections.Main = new DeckSection("Main");
  }
  
  return new Deck(name, sections as DeckSections);
});

// todo add proper compile-time enforcement
type OracleId = string;

// DeckSection is an object with internal map (oracle_id -> DeckCard), but behaves like an array externally
export class DeckSection implements Iterable<DeckCard> {
  private readonly cardsMap: Record<OracleId, DeckCard>;
  
  constructor(public name: DeckSectionName, cards?: DeckCard[] | Record<OracleId, DeckCard>) {
    // this.name = name;
    if (Array.isArray(cards)) {
      this.cardsMap = {};
      for (const card of cards) {
        this.cardsMap[card.oracle_id] = card;
      }
    }
    else if (cards) {
      this.cardsMap = {...cards};
    }
    else {
      this.cardsMap = {};
    }
  }
  
  get length(): number {
    return Object.keys(this.cardsMap).length;
  }
  
  getById(oracleId: OracleId): DeckCard | undefined {
    return this.cardsMap[oracleId];
  }
  
  push(card: DeckCard): void {
    this.cardsMap[card.oracle_id] = card;
  }
  
  addCard(card: DeckCard, amount = 1): void {
    const existing = this.cardsMap[card.oracle_id];
    if (existing) {
      existing.count += amount;
    }
    else {
      this.cardsMap[card.oracle_id] = {...card, count: amount};
    }
  }
  
  removeById(oracleId: OracleId): void {
    delete this.cardsMap[oracleId];
  }
  
  toArray(): DeckCard[] {
    return Object.values(this.cardsMap);
  }
  
  [Symbol.iterator](): Iterator<DeckCard> {
    return this.toArray()[Symbol.iterator]();
  }
  
  toJSON(): DeckCard[] {
    return this.toArray();
  }
}

export type DeckSections = {
  Main: DeckSection;
} & Partial<Record<Exclude<DeckSectionName, "Main">, DeckSection>>;

export class Deck {
  constructor(
    public name: string,
    public sections: DeckSections
  ) {
  }
  
  /**
   * Merge this deck with another deck and return a new Deck.
   * Main section cards are concatenated; optional sections are merged if present.
   */
  merge(other: Deck): Deck {
    const mergedSections: DeckSections = {
      Main: new DeckSection("Main", [
        ...this.sections.Main.toArray(),
        ...other.sections.Main.toArray()
      ])
    };
    
    // Iterate over optional section names derived from SECTION_BY_LABEL and merge them
    for (const canonical of Object.values(SECTION_BY_LABEL) as DeckSectionName[]) {
      if (canonical === "Main") {
        continue; // already handled
      }
      
      const currentArr = this.sections[canonical as Exclude<DeckSectionName, "Main">]?.toArray() ?? [];
      const otherArr = other.sections[canonical as Exclude<DeckSectionName, "Main">]?.toArray() ?? [];
      
      if (currentArr.length || otherArr.length) {
        mergedSections[canonical] = new DeckSection(canonical, [...currentArr, ...otherArr]);
      }
    }
    
    return new Deck(this.name, mergedSections);
  }
  
  /** Convenience static wrapper for merging two decks. */
  static merge(current: Deck, other: Deck): Deck {
    return current.merge(other);
  }
  
  /**
   * Reconstructs a deck from plain JSON-like data and ensures section instances are DeckSection.
   */
  static reconstruct(deck: unknown): Deck {
    // Use Zod to validate and transform input; throw on invalid input to surface errors early.
    return DeckSchema.parse(deck);
  }
}

// This structure makes it easier to store tags state separately to reduce frontend lag.
export interface TaggedDeck {
  deck: Deck;
  tagsMap: TagsMap;
}
