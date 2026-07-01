import {DeckSectionName, HydratedDeck, HydratedDeckSection, TaggedDeckCard} from "@mtgit/shared";
import {CardGroupingMode, SECTION_SCREEN_SORT_ORDER} from "../types/grouping.ts";
import {groupCardsByMode, sortGroupHeadings} from "./cardGrouping.ts";


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
  cardGroupingMode: CardGroupingMode
): DeckComparisonSection {
  const result: DeckComparisonSection = {sectionName, groups: []};

  // todo some work gets done twice here
  // further decomposition would be good here
  const leftGrouping = groupCardsByMode(Object.values(section1), cardGroupingMode);
  const leftGropingLookup = Object.fromEntries(
    leftGrouping.map(
      sortedGroup => [sortedGroup.heading, sortedGroup.cards]
    )
  );
  const rightGrouping = groupCardsByMode(Object.values(section2), cardGroupingMode);
  const rightGroupingLookup = Object.fromEntries(
    rightGrouping.map(
      sortedGroup => [sortedGroup.heading, sortedGroup.cards]
    )
  );

  const unsortedGroupHeadings = new Set([...Object.keys(leftGropingLookup), ...Object.keys(rightGroupingLookup)]);
  const groupHeadings = sortGroupHeadings([...unsortedGroupHeadings], cardGroupingMode);

  for (const groupHeading of groupHeadings) {
    result.groups.push(
      {
        heading: groupHeading,
        leftCards: leftGropingLookup[groupHeading] ?? [],
        rightCards: rightGroupingLookup[groupHeading] ?? []
      }
    );
  }

  return result;
}

export function compareDecks(deck1: HydratedDeck, deck2: HydratedDeck, groupingMode: CardGroupingMode): DeckComparisonResult {
  const output: DeckComparisonResult = [];

  for (const sectionName of SECTION_SCREEN_SORT_ORDER) {
    if (deck1[sectionName] || deck2[sectionName]) {
      output.push(
        compareSections(
          deck1[sectionName] ?? {},
          deck2[sectionName] ?? {},
          sectionName,
          groupingMode
        )
      );
    }
  }

  return output;
}