import { CssBaseline } from "@mui/material";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";
import { AppThemeProvider } from "./components/AppThemeProvider.tsx";
import "./index.css";

const app = (
  <StrictMode>
    <AppThemeProvider>
      <CssBaseline />
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </AppThemeProvider>
  </StrictMode>
);

const root = document.getElementById("root")!;
// The Vite development template contains only a comment, not rendered markup.
if (root.childElementCount > 0) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
