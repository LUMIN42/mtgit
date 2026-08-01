import {useNavigate, useParams, useSearchParams} from "react-router-dom";

export const EDITED_BRANCH_NAME_URL_KEY = "SelectedBranchName";
export const COMPARISON_BRANCH_NAME_URL_KEY = "ComparisonBranchName";
export const COMPARISON_SNAPSHOT_ID_URL_KEY = "ComparisonSnapshotId";


/**
 * Handles navigation between screens as well.
 */
export function useDeckUrlManager() {
  const params = useParams();
  const deckId = params.deckId;
  let editedBranchName = params[EDITED_BRANCH_NAME_URL_KEY];

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  editedBranchName ??= searchParams.get(EDITED_BRANCH_NAME_URL_KEY) ?? undefined;
  const comparisonBranchName = searchParams.get(COMPARISON_BRANCH_NAME_URL_KEY) ?? undefined;

  const comparisonSnapshotId = searchParams.get(COMPARISON_SNAPSHOT_ID_URL_KEY) ?? undefined;

  function setEditedBranchName(name: string) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set(EDITED_BRANCH_NAME_URL_KEY, name);
    setSearchParams(nextSearchParams);
  }

  function buildBaseSearchParams() {
    const searchParams = new URLSearchParams();

    if (editedBranchName) {
      searchParams.set(EDITED_BRANCH_NAME_URL_KEY, editedBranchName);
    }

    return searchParams;
  }

  function buildDeckBasePath() {
    return deckId ? `/app/deck/${deckId}` : "";
  }

  function setComparisonBranchName(name: string | null) {
    const searchParams = buildBaseSearchParams();

    if (name) {
      searchParams.set(COMPARISON_BRANCH_NAME_URL_KEY, name);
      navigate(`${buildDeckBasePath()}/compare?${searchParams}`);
    }
    else {
      navigateToDeckView();
    }
  }

  function setComparisonSnapshotId(id: string) {
    const searchParams = buildBaseSearchParams();

    searchParams.set(COMPARISON_SNAPSHOT_ID_URL_KEY, id);
    navigate(`${buildDeckBasePath()}/compare?${searchParams}`);
  }

  function navigateToDeckView() {
    const params = buildBaseSearchParams();
    navigate(`${buildDeckBasePath()}${params.toString() ? `?${params}` : ""}`);
  }

  return {
    editedBranchName,
    comparisonBranchName,
    comparisonSnapshotId,
    setEditedBranchName,
    setComparisonBranchName,
    setComparisonSnapshotId,
    navigateToDeckView
  };
}
