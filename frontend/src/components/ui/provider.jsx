import * as React from "react";
import { ThemeContextProvider } from "./ThemeContext";

export const UIProvider = ({ children }) => {
  return <ThemeContextProvider>{children}</ThemeContextProvider>;
};
