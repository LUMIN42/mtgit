import {HydratedDeckSection} from "@mtgit/shared";

export type DeckComparisonBlock = {
  heading: string;
  leftCards: HydratedDeckSection;
  rightCards: HydratedDeckSection;
};

export type DeckComparisonResult = {}

export function compareDecks(deck1: Deck, deck2: Deck) {

}