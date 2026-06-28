import React from "react";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import {DeckViewScreen} from "./DeckViewScreen.tsx";
import {SearchResultsScreen} from "../SearchResultsScreen.tsx";
import {DeckComparisonScreen} from "../DeckComparisonScreen.tsx";

function DeckViewScreenWrapperInner() {
  const {isSearching, comparisonBranchName} = useDeckUiContext();

  if (isSearching) {
    return <SearchResultsScreen/>;
  }
  else if (comparisonBranchName !== null) {
    return <DeckComparisonScreen/>;
  }
  else {
    return <DeckViewScreen/>;
  }
}

export default DeckViewScreenWrapperInner;