import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import createEmotionServer from "@emotion/server/create-instance";
import { CssBaseline } from "@mui/material";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppThemeProvider } from "./components/AppThemeProvider";
import { ServerAppRouter } from "./router/ServerAppRouter";
import "./index.css";

export interface ServerRenderResult {
  appHtml: string;
  styles: string;
}

/** Renders one public route during the build, ready for client hydration. */
export function render(url: string): ServerRenderResult {
  const cache = createCache({ key: "css", prepend: true });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);
  const appHtml = renderToString(
    <CacheProvider value={cache}>
      <AppThemeProvider>
        <CssBaseline />
        <AppErrorBoundary>
          <StaticRouter location={url}>
            <AppShell>
              <ServerAppRouter />
            </AppShell>
          </StaticRouter>
        </AppErrorBoundary>
      </AppThemeProvider>
    </CacheProvider>,
  );

  return {
    appHtml,
    styles: constructStyleTagsFromChunks(extractCriticalToChunks(appHtml)),
  };
}
