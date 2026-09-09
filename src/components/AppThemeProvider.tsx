import { ThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { useStore } from "../store/store";
import { createAppTheme } from "../theme";

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const themeMode = useStore((s) => s.themeMode);
  // Keep the server and hydration render deterministic. The media query updates
  // after hydration for visitors who use the system theme.
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const resolvedMode =
    themeMode === "system" ? (prefersDarkMode ? "dark" : "light") : themeMode;
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
