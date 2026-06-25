import React from "react";
import {useDeckUIContext} from "../../context/DeckUiContext.tsx";
import {DeckViewScreen} from "./DeckViewScreen.tsx";
import {SearchResultsScreen} from "../SearchResultsScreen.tsx";

function DeckViewScreenWrapperInner() {
  const {isSearching} = useDeckUIContext();

  return isSearching ? <SearchResultsScreen/> : <DeckViewScreen/>;
}

export default DeckViewScreenWrapperInner;