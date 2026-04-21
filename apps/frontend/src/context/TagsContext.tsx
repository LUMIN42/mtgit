import React, {useState, type ReactNode} from 'react';
import type {TagsMap} from '@mtgit/shared/deckImport';

import {TagsContext} from './tagsContextShared.ts';

export function TagsProvider({children}: { children: ReactNode }) {
  const [tags, setTags] = useState<TagsMap>({});

  const allTags = Array.from(new Set(Object.values(tags).flat())).sort();

  return (
    <TagsContext.Provider value={{tags, setTags, allTags}}>
      {children}
    </TagsContext.Provider>
  );
}

