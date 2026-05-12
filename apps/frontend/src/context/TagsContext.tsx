import {useEffect, useState, type ReactNode} from "react";
import type {TagsMap} from "@mtgit/shared";

import {TagsContext} from "./tagsContextShared.ts";
import {useRepositoryContext} from "./RepositoryContext.tsx";

export function TagsProvider({children}: {children: ReactNode}) {
  const [tags, setTags] = useState<TagsMap>({});
  const {repository} = useRepositoryContext();

  useEffect(() => {
    if (repository) {
      setTags(repository.tags);
    }
  }, [repository]);

  const allTags = Array.from(new Set(Object.values(tags).flat())).sort();

  return (
    <TagsContext.Provider value={{tags, setTags, allTags}}>
      {children}
    </TagsContext.Provider>
  );
}

