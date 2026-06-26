import React, {ReactNode} from "react";
import {useRepositoryContext} from "./RepositoryContext.tsx";
import {DeckDataProvider} from "./DeckDataContext.tsx";

type DeckDataProviderWrapperProps = {
  children: ReactNode;
};

function DeckDataProviderWrapper({children}: DeckDataProviderWrapperProps) {
  const {selectedBranchContent} = useRepositoryContext();

  return (
    <DeckDataProvider sections={selectedBranchContent}>
      {children}
    </DeckDataProvider>
  );
}

export default DeckDataProviderWrapper;