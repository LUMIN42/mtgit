import {DeckSectionName} from "@mtgit/shared";

export type Location = Record<string, string | null>;


export type CardLocation = {
  oracle_id: string;
  location: Location;
};

export type DeckGroupLocation = {
  section: DeckSectionName | null;
  group: string | null;
};

export type DeckGroupCardLocation = {
  oracle_id: string;
  location: DeckGroupLocation;
};