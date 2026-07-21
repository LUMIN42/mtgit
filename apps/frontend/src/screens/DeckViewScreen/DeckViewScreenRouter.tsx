import React from "react";
import {useDeckUiContext} from "../../context/DeckUiContext.tsx";
import {DeckViewScreen} from "./DeckViewScreen.tsx";
import {SearchResultsScreen} from "../SearchResultsScreen.tsx";
import {DeckComparisonScreen} from "../DeckComparisonScreen.tsx";
import {Routes, Route, Navigate} from "react-router-dom";
import {DeckHistoryOverviewScreen} from "../DeckHistoryOverviewScreen.tsx";

export function DeckViewScreenRouter() {
  const {comparisonContent} = useDeckUiContext();

  return (
    <Routes>
      <Route path="search" element={<SearchResultsScreen/>}/>

      <Route
        index
        element={
          comparisonContent === null
            ? <DeckViewScreen/>
            : <DeckComparisonScreen/>
        }
      />

      <Route path="history" element={<DeckHistoryOverviewScreen/>}/>

      <Route path="*" element={<Navigate to="." replace/>}/>
    </Routes>
  );
}