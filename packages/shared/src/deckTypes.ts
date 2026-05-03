// Deck-related shared types.

import {z} from "zod";
import {ScryfallOracleCardSchema} from "./scryfall.js";
import type {ScryfallOracleCard} from "./scryfall.js";

export type TagsMap = Record<string, string[]>;


export const DECK_SECTION_NAMES = ["Main", "Commander", "Sideboard", "Considering"] as const;
export type DeckSectionName = typeof DECK_SECTION_NAMES[number];

export type OptionalDeckSectionName = Exclude<DeckSectionName, "Main">;

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


export function isDeckCard(x: ScryfallOracleCard): x is DeckCard {
  return typeof (x as DeckCard).count === "number";
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
export class DeckSection<T extends DeckCard = DeckCard> implements Iterable<T> {
  private readonly cardsMap: Record<OracleId, T>;
  
  constructor(public name: DeckSectionName, cards?: T[] | Record<OracleId, T>) {
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
  
  getById(oracleId: OracleId): T | undefined {
    return this.cardsMap[oracleId];
  }
  
  push(card: T): void {
    this.cardsMap[card.oracle_id] = card;
  }
  
  addCard(card: T, amount = 1): void {
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
  
  toArray(): T[] {
    return Object.values(this.cardsMap);
  }
  
  /**
   * Returns total card amount in this section (sum of DeckCard.count),
   * not just number of unique card entries.
   */
  getCardCount(): number {
    for (const tst of this.toArray()) {
      if (tst.name === "Plains") {
        console.log(tst);
      }
    }
    return this.toArray().reduce((sum, card) => sum + card.count, 0);
  }
  
  [Symbol.iterator](): Iterator<T> {
    return this.toArray()[Symbol.iterator]();
  }
  
  toJSON(): T[] {
    return this.toArray();
  }
}

export type DeckSections<T extends DeckCard = DeckCard> = {
  Main: DeckSection<T>;
} & Partial<Record<OptionalDeckSectionName, DeckSection<T>>>;

export class Deck<T extends DeckCard = DeckCard> {
  constructor(public name: string, public sections: DeckSections<T>) {
  }
  
  /**
   * Merge this deck with another deck and return a new Deck.
   * Main section cards are concatenated; optional sections are merged if present.
   */
  merge(other: Deck<T>): Deck<T> {
    const mergedSections: DeckSections<T> = {
      Main: new DeckSection<T>("Main", [
        ...this.sections.Main.toArray(),
        ...other.sections.Main.toArray()
      ])
    };
    
    // Iterate over optional section names and merge them
    for (const canonical of DECK_SECTION_NAMES) {
      if (canonical === "Main") {
        continue; // already handled
      }
      
      const currentArr = this.sections[canonical as OptionalDeckSectionName]?.toArray() ?? [];
      const otherArr = other.sections[canonical as OptionalDeckSectionName]?.toArray() ?? [];
      
      if (currentArr.length || otherArr.length) {
        mergedSections[canonical] = new DeckSection<T>(canonical, [...currentArr, ...otherArr]);
      }
    }
    return new Deck<T>(this.name, mergedSections);
  }
  
  /** Convenience static wrapper for merging two decks. */
  static merge<U extends DeckCard = DeckCard>(current: Deck<U>, other: Deck<U>): Deck<U> {
    return current.merge(other);
  }
  
  /**
   * Reconstructs a deck from plain JSON-like data and ensures section instances are DeckSection.
   */
  static reconstruct(deck: unknown): Deck {
    // Use Zod to validate and transform input; throw on invalid input to surface errors early.
    return DeckSchema.parse(deck);
  }
  
  /**
   * Returns total card amount in deck sections (sum of DeckCard.count),
   * excluding the Considering section.
   */
  getCardCount(): number {
    let total = this.sections.Main.getCardCount();
    
    for (const canonical of DECK_SECTION_NAMES) {
      if (canonical === "Main" || canonical === "Considering") {
        continue;
      }
      
      total += this.sections[canonical as OptionalDeckSectionName]?.getCardCount() ?? 0;
    }
    
    return total;
  }
  
  static empty<U extends DeckCard = DeckCard>(name: string): Deck<U> {
    return new Deck<U>(name, {
      Main: new DeckSection<U>("Main", [])
    });
  }
}

/**
 * A DeckCard annotated with tags. Intended for UI consumption (filtering, badges, etc.).
 * Generic over the underlying card type so callers can preserve richer card shapes.
 */
export type TaggedDeckCard = DeckCard & {
  tags: string[];
};

/** Tagged sections are regular DeckSections parameterized by TaggedDeckCard. */
export type TaggedDeckSections = DeckSections<TaggedDeckCard>;

/**
 * A convenience container pairing a `Deck` with a `TagsMap` and the derived
 * `TaggedDeckSections` overlay. This keeps the canonical `Deck` unchanged and
 * provides a view optimized for UI code.
 */
export interface TaggedDeck {
  deck: Deck<TaggedDeckCard>;
  tagsMap: TagsMap;
}

/**
 * Convert a `DeckSections` object together with a `TagsMap` into a `TaggedDeckSections` view.
 * The function is pure and does not mutate inputs.
 */
export function toTaggedDeckSections<T extends DeckCard = DeckCard>(sections: DeckSections<T>, tagsMap: TagsMap): TaggedDeckSections {
  const out: Partial<TaggedDeckSections> = {};
  for (const name of DECK_SECTION_NAMES) {
    const s = sections[name] as DeckSection<T> | undefined;
    if (s) {
      // Create a DeckSection<TaggedDeckCard<T>> by mapping base cards to tagged variants.
      const taggedArray: TaggedDeckCard[] = s.toArray().map(c => ({
        ...c,
        tags: tagsMap[c.oracle_id] ?? []
      } as TaggedDeckCard));
      out[name] = new DeckSection<TaggedDeckCard>(name as DeckSectionName, taggedArray);
    }
  }
  // `Deck` instances are validated to always include `Main`, so assertion is safe here.
  return out as TaggedDeckSections;
}

/**
 * Convenience helper that returns a `TaggedDeck` view for a given `Deck` and `TagsMap`.
 */
export function withTags<T extends DeckCard = DeckCard>(deck: Deck<T>, tagsMap: TagsMap): TaggedDeck {
  const deckWithTags = new Deck<TaggedDeckCard>(deck.name, toTaggedDeckSections(deck.sections, tagsMap));
  
  return {deck: deckWithTags, tagsMap};
}
