import {useContext} from 'react';

import {TagsContext} from './tagsContextShared.ts';
import type {TagsContextType} from './tagsContextShared.ts';

export function useTagsContext(): TagsContextType {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error('useTagsContext must be used within a TagsProvider');
  }
  return context;
}


