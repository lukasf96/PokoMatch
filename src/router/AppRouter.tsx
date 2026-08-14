import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  HomePage,
  HabitatRoommateGuidePage,
  InsightsPage,
  MatcherPage,
  PokedexPage,
  SpecialtyGroupsGuidePage,
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
      <Route
        path={appRoutes.habitatGuide}
        element={<HabitatRoommateGuidePage />}
      />
      <Route
        path={appRoutes.specialtyGuide}
        element={<SpecialtyGroupsGuidePage />}
      />
      <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
    </Routes>
    </Suspense>
  );
}
