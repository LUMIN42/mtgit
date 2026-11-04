import {useNavigate, useParams, useSearchParams} from "react-router-dom";

export const EDITED_BRANCH_NAME_URL_KEY = "SelectedBranchName";
export const COMPARISON_BRANCH_NAME_URL_KEY = "ComparisonBranchName";
export const COMPARISON_SNAPSHOT_ID_URL_KEY = "ComparisonSnapshotId";

/**
 * Screens of a deck, relative to the deck's base path.
 */
type DeckScreen = "" | "search" | "history" | "compare";

/**
 * The single owner of deck URLs: the edited branch lives only in the {@link EDITED_BRANCH_NAME_URL_KEY} query parameter.
 * Build every link and navigation between deck screens here, so the branch is never dropped.
 */
export function useDeckUrlManager() {
  const {deckId} = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  const editedBranchName = searchParams.get(EDITED_BRANCH_NAME_URL_KEY) ?? undefined;
  const comparisonBranchName = searchParams.get(COMPARISON_BRANCH_NAME_URL_KEY) ?? undefined;
  const comparisonSnapshotId = searchParams.get(COMPARISON_SNAPSHOT_ID_URL_KEY) ?? undefined;

  /**
   * @param extraParams added next to the edited branch
   * @returns path of a deck screen keeping the edited branch, usable as a link target.
   */
  function buildDeckPath(screen: DeckScreen, extraParams: Record<string, string> = {}) {
    const params = new URLSearchParams();

    if (editedBranchName) {
      params.set(EDITED_BRANCH_NAME_URL_KEY, editedBranchName);
    }

    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }

    const basePath = deckId ? `/app/deck/${deckId}` : "";
    const path = screen ? `${basePath}/${screen}` : basePath;

    return params.size > 0 ? `${path}?${params}` : path;
  }

  function setEditedBranchName(name: string) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set(EDITED_BRANCH_NAME_URL_KEY, name);
    setSearchParams(nextSearchParams);
  }

  /**
   * Swaps the edited and the comparison branch while staying on the current screen.
   */
  function swapBranches(edited: string, comparison: string) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set(EDITED_BRANCH_NAME_URL_KEY, comparison);
    nextSearchParams.set(COMPARISON_BRANCH_NAME_URL_KEY, edited);
    setSearchParams(nextSearchParams);
  }

  function setComparisonBranchName(name: string | null) {
    if (name) {
      navigate(buildDeckPath("compare", {[COMPARISON_BRANCH_NAME_URL_KEY]: name}));
    }
    else {
      navigateToDeckView();
    }
  }

  function setComparisonSnapshotId(id: string) {
    navigate(buildDeckPath("compare", {[COMPARISON_SNAPSHOT_ID_URL_KEY]: id}));
  }

  const buildDeckViewPath = () => buildDeckPath("");
  const buildSearchPath = () => buildDeckPath("search");
  const buildHistoryPath = () => buildDeckPath("history");

  function navigateToDeckView() {
    navigate(buildDeckViewPath());
  }

  function navigateToSearch() {
    navigate(buildSearchPath());
  }

  return {
    editedBranchName,
    comparisonBranchName,
    comparisonSnapshotId,
    setEditedBranchName,
    swapBranches,
    setComparisonBranchName,
    setComparisonSnapshotId,
    buildDeckViewPath,
    buildSearchPath,
    buildHistoryPath,
    navigateToDeckView,
    navigateToSearch
  };
}
