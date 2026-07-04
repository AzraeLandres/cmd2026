import { createContext, useContext } from "react";
import HeaderState from "@interfaces/HeaderState";

type SetHeader = (state: Partial<HeaderState>) => void;

export const HeaderContext = createContext<SetHeader>(() => {});

export function useHeader(): SetHeader {
  return useContext(HeaderContext);
}
