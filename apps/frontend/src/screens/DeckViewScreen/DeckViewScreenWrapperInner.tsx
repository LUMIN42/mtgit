import React from "react";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import {DeckViewScreen} from "./DeckViewScreen.tsx";
import {SearchResultsScreen} from "../SearchResultsScreen.tsx";

function DeckViewScreenWrapperInner() {
  const {isSearching} = useDeckUiContext();

  return isSearching ? <SearchResultsScreen/> : <DeckViewScreen/>;
}

export default DeckViewScreenWrapperInner;