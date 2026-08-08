import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  HomePage,
  InsightsPage,
  MatcherPage,
  PokedexPage,
} from "./lazyPages";
import { appRoutes } from "./routes";

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
      <Route path={appRoutes.home} element={<HomePage />} />
      <Route path={appRoutes.matchmaker} element={<MatcherPage />} />
      <Route path={appRoutes.insights} element={<InsightsPage />} />
      <Route path={appRoutes.pokedex} element={<PokedexPage />} />
      <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
    </Routes>
    </Suspense>
  );
}
