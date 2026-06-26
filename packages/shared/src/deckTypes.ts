// Deck-related shared types.

import type {ScryfallOracleCard} from "./scryfall.js";
import {
  DECK_SECTION_NAMES,
  DeckSectionName,
  OptionalDeckSectionName,
  TagsMap
} from "./repositoryTypes.js";


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

// todo add proper compile-time enforcement
type OracleId = string;

// DeckSection is an object with internal map (oracle_id -> DeckCard), but behaves like an array externally
export class DeckSection implements Iterable<TaggedDeckCard> {
  private readonly cardsMap: Record<OracleId, TaggedDeckCard>;

  constructor(public name: DeckSectionName, cards?: TaggedDeckCard[] | Record<OracleId, TaggedDeckCard>) {
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

  getById(oracleId: OracleId): TaggedDeckCard | undefined {
    return this.cardsMap[oracleId];
  }

  push(card: TaggedDeckCard): void {
    this.cardsMap[card.oracle_id] = card;
  }

  isEmpty(): boolean {
    return Object.keys(this.cardsMap).length === 0;
  }

  addCard(card: TaggedDeckCard, amount = 1): void {
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

  toArray(): TaggedDeckCard[] {
    return Object.values(this.cardsMap);
  }

  /**
   * Returns total card amount in this section (sum of DeckCard.count),
   * not just number of unique card entries.
   */
  getCardCount(): number {
    console.log("wtf?");

    return this
      .toArray()
      .reduce((sum, card) => sum + (card.count ?? 1), 0);
  }

  [Symbol.iterator](): Iterator<TaggedDeckCard> {
    return this.toArray()[Symbol.iterator]();
  }
}

export type DeckSections = {
  Main: DeckSection;
} & Partial<Record<OptionalDeckSectionName, DeckSection>>;

export class Deck {
  constructor(public name: string, public sections: DeckSections) {
  }

  isEmpty(): boolean {
    return Object.values(this.sections).reduce(
      (cum, cur) => cum && cur.isEmpty(),
      true
    );
  }

  // toDeckCardAmounts(): DeckCardCounts {
  //   const sections: DeckCardCounts = emptyDeckCardCounts();
  //   for (const sectionName of DECK_SECTION_NAMES) {
  //     const section = this.sections[sectionName as DeckSectionName];
  //     if (!section) {
  //       continue;
  //     }
  //     const counts: CardCounts = {};
  //     for (const card of section.toArray()) {
  //       counts[card.oracle_id] = card.count;
  //     }
  //     sections[sectionName as DeckSectionName] = counts;
  //   }
  //
  //   return sections as DeckCardCounts;
  // }

  /**
   * Merge this deck with another deck and return a new Deck.
   * Main section cards are concatenated; optional sections are merged if present.
   */
  // merge(other: Deck): Deck {
  //   const mergedSections: DeckSections = {
  //     Main: new DeckSection("Main", [
  //       ...this.sections.Main.toArray(),
  //       ...other.sections.Main.toArray()
  //     ])
  //   };
  //
  //   // Iterate over optional section names and merge them
  //   for (const canonical of DECK_SECTION_NAMES) {
  //     if (canonical === "Main") {
  //       continue; // already handled
  //     }
  //
  //     const currentArr = this.sections[canonical as OptionalDeckSectionName]?.toArray() ?? [];
  //     const otherArr = other.sections[canonical as OptionalDeckSectionName]?.toArray() ?? [];
  //
  //     if (currentArr.length || otherArr.length) {
  //       mergedSections[canonical] = new DeckSection(canonical, [...currentArr, ...otherArr]);
  //     }
  //   }
  //   return new Deck(this.name, mergedSections);
  // }

  /** Convenience static wrapper for merging two decks. */
  // static merge(current: Deck, other: Deck): Deck {
  //   return current.merge(other);
  // }

  static empty(name: string): Deck {
    return new Deck(name, {
      Main: new DeckSection("Main", [])
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
export type TaggedDeckSections = DeckSections;

/**
 * A convenience container pairing a `Deck` with a `TagsMap` and the derived
 * `TaggedDeckSections` overlay. This keeps the canonical `Deck` unchanged and
 * provides a view optimized for UI code.
 */
export interface TaggedDeck {
  deck: Deck;
  tagsMap: TagsMap;
}

/**
 * Convert a `DeckSections` object together with a `TagsMap` into a `TaggedDeckSections` view.
 * The function is pure and does not mutate inputs.
 */
export function toTaggedDeckSections(sections: DeckSections, tagsMap: TagsMap): TaggedDeckSections {
  const out: Partial<TaggedDeckSections> = {};
  for (const name of DECK_SECTION_NAMES) {
    const s = sections[name] as DeckSection | undefined;
    if (s) {
      // Create a DeckSection<TaggedDeckCard<T>> by mapping base cards to tagged variants.
      const taggedArray: TaggedDeckCard[] = s.toArray().map(c => ({
        ...c,
        tags: tagsMap[c.oracle_id] ?? []
      } as TaggedDeckCard));
      out[name] = new DeckSection(name as DeckSectionName, taggedArray);
    }
  }
  // `Deck` instances are validated to always include `Main`, so assertion is safe here.
  return out as TaggedDeckSections;
}

/**
 * Convenience helper that returns a `TaggedDeck` view for a given `Deck` and `TagsMap`.
 */
export function withTags(deck: Deck, tagsMap: TagsMap): TaggedDeck {
  const deckWithTags = new Deck(deck.name, toTaggedDeckSections(deck.sections, tagsMap));

  return {deck: deckWithTags, tagsMap};
}
