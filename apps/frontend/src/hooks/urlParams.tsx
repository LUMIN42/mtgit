import {useParams, useSearchParams} from "react-router-dom";


export const EDITED_BRANCH_NAME_URL_KEY = "selectedBranchName";
export const COMPARISON_BRANCH_NAME_URL_KEY = "comparisonBranchName";

export function useDeckUrlParams() {
  const params = useParams();
  let editedBranchName = params[EDITED_BRANCH_NAME_URL_KEY];

  const [searchParams, setSearchParams] = useSearchParams();

  editedBranchName ??= searchParams.get(EDITED_BRANCH_NAME_URL_KEY) ?? undefined;
  const comparisonBranchName = searchParams.get(COMPARISON_BRANCH_NAME_URL_KEY) ?? undefined;

  return {
    editedBranchName,
    comparisonBranchName
  };
}
