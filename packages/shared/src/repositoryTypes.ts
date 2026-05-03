import {Deck, TagsMap} from "./deckTypes";


export type TimeStamp = number;

export interface DeckVersion {
  deck: Deck;
  timestamp: TimeStamp;
}

export interface Branch {
  name: string;
  versions: DeckVersion[];
}

export interface Repository {
  name: string;
  tags: TagsMap,
  branches: Branch[]
}