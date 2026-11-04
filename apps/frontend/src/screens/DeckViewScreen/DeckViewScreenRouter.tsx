import React from "react";
import {DeckViewScreen} from "./DeckViewScreen.tsx";
import {SearchResultsScreen} from "../SearchResultsScreen.tsx";
import {DeckComparisonScreen} from "../DeckComparisonScreen.tsx";
import {Routes, Route, Navigate} from "react-router-dom";
import {DeckHistoryOverviewScreen} from "../DeckHistoryOverviewScreen.tsx";

/**
 * Dispatches between scryfall search screen, history screen deck view screen and deck comparison screen.
 * The edited branch is a query parameter, see {@link useDeckUrlManager}.
 * Must be used as a part of {@link DeckViewScreenWrapper}
 */
export function DeckViewScreenRouter() {
  return (
    <Routes>
      <Route path="search" element={<SearchResultsScreen/>}/>

      <Route
        index
        element={
          <DeckViewScreen/>
        }
      />

      <Route path={"compare"} element={<DeckComparisonScreen/>}/>

      <Route path={"history"} element={<DeckHistoryOverviewScreen/>}/>

      <Route path="*" element={<Navigate to="." replace/>}/>
    </Routes>
  );
}
