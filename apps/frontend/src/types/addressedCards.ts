import {DeckSectionName} from "@mtgit/shared";

export type Location = Record<string, string>;


export type CardLocation = {
  oracle_id: string;
  location: Location;
};

export type DeckGroupLocation = {
  section: DeckSectionName;
  group: string;
};

export type DeckGroupCardLocation = {
  oracle_id: string;
  location: DeckGroupLocation;
};