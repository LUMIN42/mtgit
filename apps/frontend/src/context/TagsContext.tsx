import React, {createContext, useContext, useState, type ReactNode} from 'react';

export type TagsMap = { [cardId: string]: string[] };

interface TagsContextType {
  tags: TagsMap;
  setTags: React.Dispatch<React.SetStateAction<TagsMap>>;
  allTags: string[];
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export function TagsProvider({children}: { children: ReactNode }) {
  const [tags, setTags] = useState<TagsMap>({});

  const allTags = Array.from(new Set(Object.values(tags).flat())).sort();

  return (
    <TagsContext.Provider value={{tags, setTags, allTags}}>
      {children}
    </TagsContext.Provider>
  );
}

export function useTagsContext(): TagsContextType {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error('useTagsContext must be used within a TagsProvider');
  }
  return context;
}
