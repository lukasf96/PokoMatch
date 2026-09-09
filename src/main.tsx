import { CssBaseline } from "@mui/material";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";
import { AppThemeProvider } from "./components/AppThemeProvider.tsx";
import { StoreHydrator } from "./components/StoreHydrator.tsx";
import "./index.css";

hydrateRoot(document.getElementById("root")!,
  <StrictMode>
    <AppThemeProvider>
      <CssBaseline />
      <AppErrorBoundary>
        <StoreHydrator>
          <App />
        </StoreHydrator>
      </AppErrorBoundary>
    </AppThemeProvider>
  </StrictMode>,
);
