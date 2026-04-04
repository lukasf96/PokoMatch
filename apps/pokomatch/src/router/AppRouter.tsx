import { Box, CircularProgress } from "@mui/material";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { appRoutes } from "./routes";

const MatcherPage = lazy(() => import("../pages/MatchMaker/MatcherPage"));
const InsightsPage = lazy(() => import("../pages/Insights/InsightsPage"));
const PokedexPage = lazy(() => import("../pages/Pokedex/PokedexPage"));

function RouteFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
      }}
    >
      <CircularProgress aria-label="Loading page" />
    </Box>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route
        path="/"
        element={<Navigate to={appRoutes.matchmaker} replace />}
      />
      <Route path={appRoutes.matchmaker} element={<MatcherPage />} />
      <Route path={appRoutes.insights} element={<InsightsPage />} />
      <Route path={appRoutes.pokedex} element={<PokedexPage />} />
      <Route
        path="*"
        element={<Navigate to={appRoutes.matchmaker} replace />}
      />
    </Routes>
    </Suspense>
  );
}
