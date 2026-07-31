import React from "react";
import {DeckViewScreen} from "./DeckViewScreen.tsx";
import {SearchResultsScreen} from "../SearchResultsScreen.tsx";
import {DeckComparisonScreen} from "../DeckComparisonScreen.tsx";
import {Routes, Route, Navigate} from "react-router-dom";
import {DeckHistoryOverviewScreen} from "../DeckHistoryOverviewScreen.tsx";
import {EDITED_BRANCH_NAME_URL_KEY} from "../../hooks/DeckUrlManager.tsx";

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

      <Route path={`:${EDITED_BRANCH_NAME_URL_KEY}`} element={<DeckViewScreen/>}/>

      <Route path={"compare"} element={<DeckComparisonScreen/>}/>

      <Route path={"history"} element={<DeckHistoryOverviewScreen/>}/>
      <Route path={`history/:${EDITED_BRANCH_NAME_URL_KEY}`} element={<DeckHistoryOverviewScreen/>}/>

      <Route path="*" element={<Navigate to="." replace/>}/>
    </Routes>
  );
}