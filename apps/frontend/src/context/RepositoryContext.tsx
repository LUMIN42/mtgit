import {createContext,useContext,useEffect,useState} from "react";
import type{ReactNode} from "react";
import type{DeckCardAmounts, Repository} from "@mtgit/shared";

/**
 * Repository state plus active branch selection.
 */
type RepositoryContextValue = {
  repository: Repository | null;
  setRepository: (r: Repository) => void;
  selectedBranchName: string | null;
  setSelectedBranchName: (n: string | null) => void;
};

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

/**
 * Provides repository state and active branch selection.
 */
export function RepositoryProvider({children,initialRepository}:{children:ReactNode, initialRepository?: Repository | null}){
  const [repository, setRepositoryState] = useState<Repository | null>(() => {
    return initialRepository ?? createEmptyRepository();
  });

  const [selectedBranchName,setSelectedBranchName] = useState<string | null>(repository?.branches?.[0]?.name ?? null);

  useEffect(() => {
    if (repository && !selectedBranchName) {
      setSelectedBranchName(repository.branches?.[0]?.name ?? null);
    }
  }, [repository, selectedBranchName]);

  function setRepository(r: Repository) {
    setRepositoryState(r);
    const nextSelected = r.branches.find(branch => branch.name === selectedBranchName)?.name
      ?? r.branches?.[0]?.name
      ?? null;
    setSelectedBranchName(nextSelected);
  }

  return (
    <RepositoryContext.Provider value={{repository,setRepository,selectedBranchName,setSelectedBranchName}}>
      {children}
    </RepositoryContext.Provider>
  );
}

/**
 * Access the repository context.
 */
export function useRepositoryContext() {
  const ctx = useContext(RepositoryContext);
  if (!ctx) {
    throw new Error("useRepositoryContext must be used within RepositoryProvider");
  }

  return ctx;
}

function createEmptyRepository(): Repository {
  const rootId = crypto.randomUUID();
  const emptySections: DeckCardAmounts = {};
  return {
    name: "Untitled Repository",
    tags: {},
    branches: [
      {
        name: "main",
        rootVersion: undefined,
        versions: [
          {
            id: rootId,
            timestamp: Date.now(),
            sections: emptySections
          }
        ]
      }
    ]
  };
}
