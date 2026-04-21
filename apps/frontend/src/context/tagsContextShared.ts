import {createContext} from 'react';

import type React from 'react';
import type {TagsMap} from '@mtgit/shared/deckImport';

export interface TagsContextType {
  tags: TagsMap;
  setTags: React.Dispatch<React.SetStateAction<TagsMap>>;
  allTags: string[];
}

export const TagsContext = createContext<TagsContextType | undefined>(undefined);

