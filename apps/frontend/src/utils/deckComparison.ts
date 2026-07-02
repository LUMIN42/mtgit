import {DeckSectionName, HydratedDeck, HydratedDeckSection, TaggedDeckCard} from "@mtgit/shared";
import {CardGroupingMode, CardSortMode, SECTION_SCREEN_SORT_ORDER} from "../types/grouping.ts";
import {handleSection, sortGroupHeadings} from "./cardGrouping.ts";


export type DeckComparisonGroup = {
  heading: string;
  leftCards: TaggedDeckCard[];
  rightCards: TaggedDeckCard[];
};

export type DeckComparisonSection = {
  sectionName: DeckSectionName;
  groups: DeckComparisonGroup[];
};

export type DeckComparisonResult = DeckComparisonSection[];

export function compareSections(
  section1: HydratedDeckSection,
  section2: HydratedDeckSection,
  sectionName: DeckSectionName,
  cardGroupingMode: CardGroupingMode,
  cardSortingMode: CardSortMode
): DeckComparisonSection {
  const result: DeckComparisonSection = {sectionName, groups: []};

  // todo some work gets done twice here
  // further decomposition would be good here
  const leftGrouping = handleSection(
    section1,
    sectionName,
    cardGroupingMode,
    cardSortingMode
  );

  const leftGroupingLookup = Object.fromEntries(
    leftGrouping.groups.map(group => [
      group.heading,
      group.cards
    ])
  );

  const rightGrouping = handleSection(
    section2,
    sectionName,
    cardGroupingMode,
    cardSortingMode
  );

  const rightGroupingLookup = Object.fromEntries(
    rightGrouping.groups.map(group => [
      group.heading,
      group.cards
    ])
  );

  const unsortedGroupHeadings = new Set([...Object.keys(leftGroupingLookup), ...Object.keys(rightGroupingLookup)]);
  const groupHeadings = sortGroupHeadings([...unsortedGroupHeadings], cardGroupingMode);

  for (const groupHeading of groupHeadings) {
    result.groups.push(
      {
        heading: groupHeading,
        leftCards: leftGroupingLookup[groupHeading] ?? [],
        rightCards: rightGroupingLookup[groupHeading] ?? []
      }
    );
  }

  return result;
}

export function compareDecks(deck1: HydratedDeck, deck2: HydratedDeck, groupingMode: CardGroupingMode, sortingMode: CardSortMode): DeckComparisonResult {
  const output: DeckComparisonResult = [];

  for (const sectionName of SECTION_SCREEN_SORT_ORDER) {
    if (deck1[sectionName] || deck2[sectionName]) {
      output.push(
        compareSections(
          deck1[sectionName] ?? {},
          deck2[sectionName] ?? {},
          sectionName,
          groupingMode,
          sortingMode
        )
      );
    }
  }

  return output;
}