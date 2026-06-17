import type {DeckSectionName, TagsMap} from "./deckTypes.js";

type UUID = string;


export type OracleId = string;
export type CardCounts = Record<OracleId, number>;


export type TimeStamp = number;


export type DeckCardAmounts = Partial<Record<DeckSectionName, CardCounts>>;

export interface DeckVersion {
  id: UUID;
  sections: DeckCardAmounts;
  timestamp: TimeStamp;
}

export interface Branch {
  name: string;
  versions: DeckVersion[];
  rootVersion: UUID | undefined;
}

export interface Repository {
  name: string;
  tags: TagsMap;
  branches: Branch[];
}

export function createDeckVersion(sections: DeckCardAmounts): DeckVersion {
  return {
    id: crypto.randomUUID(),
    sections,
    timestamp: Date.now()
  };
}

export function copyDeckCardAmounts(cardAmounts: DeckCardAmounts) {
  return {...cardAmounts};
}

/**
 * Merge two tag maps, preserving existing tags and adding any new ones.
 */
export function mergeTagsMaps(currentTags: TagsMap, importedTags: TagsMap): TagsMap {
  const merged: TagsMap = {...currentTags};

  for (const [cardId, tags] of Object.entries(importedTags) as [string, string[]][]) {
    const existingTags = merged[cardId] ?? [];
    merged[cardId] = Array.from(new Set([...existingTags, ...tags]));
  }

  return merged;
}

/**
 * Append a new version to a branch and return a new repository instance.
 */
export function appendRepositoryVersion(
  repository: Repository,
  branchName: string,
  sections: DeckCardAmounts,
  tags: TagsMap
): Repository {
  // todo consider cleaning the clutter in the method

  const newVersion: DeckVersion = createDeckVersion(sections);

  let hasBranch = false;
  const branches = repository.branches.map(branch => {
    if (branch.name !== branchName) {
      return branch;
    }

    hasBranch = true;
    const versions = [...branch.versions, newVersion];
    const rootVersion = branch.rootVersion ?? versions[0]?.id;
    return {...branch, versions, rootVersion};
  });

  if (!hasBranch) {
    branches.push({
      name: branchName,
      rootVersion: newVersion.id,
      versions: [newVersion]
    });
  }

  return {
    ...repository,
    tags,
    branches
  };
}


export function mergeDecks(
  a: CardCounts,
  b: CardCounts
): CardCounts {
  const result: CardCounts = {...a};

  for (const [oracleId, count] of Object.entries(b)) {
    result[oracleId] = (result[oracleId] ?? 0) + count;
  }

  return result;
}