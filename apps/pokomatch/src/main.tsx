import { CssBaseline } from "@mui/material";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";
import { AppThemeProvider } from "./components/AppThemeProvider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppThemeProvider>
      <CssBaseline />
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </AppThemeProvider>
  </StrictMode>,
);
