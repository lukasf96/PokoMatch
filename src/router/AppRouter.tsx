import { Box, CircularProgress } from "@mui/material";
import { Suspense, type ElementType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  HomePage,
  HabitatRoommateGuidePage,
  InsightsPage,
  MatcherPage,
  PokedexPage,
  SpecialtyGroupsGuidePage,
} from "./lazyPages";
import { StoreHydrator } from "../components/StoreHydrator";
import { appRouteEntries, appRoutes, type AppRouteId } from "./routes";

const routeComponents: Record<AppRouteId, ElementType> = {
  home: HomePage,
  matchmaker: MatcherPage,
  insights: InsightsPage,
  pokedex: PokedexPage,
  habitatGuide: HabitatRoommateGuidePage,
  specialtyGuide: SpecialtyGroupsGuidePage,
};

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
      <StoreHydrator>
        <Routes>
          {appRouteEntries.map(([id, route]) => {
            const Component = routeComponents[id];
            return <Route key={id} path={route.path} element={<Component />} />;
          })}
          <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
        </Routes>
      </StoreHydrator>
    </Suspense>
  );
}
