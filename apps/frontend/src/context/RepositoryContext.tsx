import React, { createContext, useContext, useState, type ReactNode } from "react";
// @ts-ignore
import type {Repository} from "@mtgit/shared/src/repositoryTypes.ts";

type MyContextType = {
  value: Repository;
  setValue: (v: Repository) => void;
};

const MyContext = createContext<MyContextType | undefined>(undefined);

type MyProviderProps = {
  children: ReactNode;
};

export function RepositoryProvider({ children }: MyProviderProps) {
  const [value, setValue] = useState<number>(0);

  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
}

export function useRepositoryContext() {
  const ctx = useContext(MyContext);

  if (!ctx) {
    throw new Error("useMyContext must be used inside MyProvider");
  }

  return ctx;
}