import React, {ReactNode} from "react";
import {useRepositoryContext} from "./RepositoryContext.tsx";
import {DeckDataProviderInner} from "./DeckDataContext.tsx";

type DeckDataProviderWrapperProps = {
  children: ReactNode;
};

export function DeckDataProviderWrapper({children}: DeckDataProviderWrapperProps) {
  const {selectedBranchContent} = useRepositoryContext();

  return (
    <DeckDataProviderInner sections={selectedBranchContent}>
      {children}
    </DeckDataProviderInner>
  );
}