import { Suspense, type ElementType } from "react";
import { Route, Routes } from "react-router-dom";
import HabitatRoommateGuidePage from "../pages/Guides/HabitatRoommateGuidePage";
import SpecialtyGroupsGuidePage from "../pages/Guides/SpecialtyGroupsGuidePage";
import HomePage from "../pages/Home/HomePage";
import InsightsPage from "../pages/Insights/InsightsPage";
import MatcherPage from "../pages/MatchMaker/MatcherPage";
import PokedexPage from "../pages/Pokedex/PokedexPage";
import { appRouteEntries, type AppRouteId } from "./routes";

const routeComponents: Record<AppRouteId, ElementType> = {
  home: HomePage,
  matchmaker: MatcherPage,
  insights: InsightsPage,
  pokedex: PokedexPage,
  habitatGuide: HabitatRoommateGuidePage,
  specialtyGuide: SpecialtyGroupsGuidePage,
};

/** Eager route tree used only while generating HTML at build time. */
export function ServerAppRouter() {
  return (
    // Match the client boundary even though these build-time imports are eager.
    <Suspense fallback={null}>
      <Routes>
        {appRouteEntries.map(([id, route]) => {
          const Component = routeComponents[id];
          return <Route key={id} path={route.path} element={<Component />} />;
        })}
      </Routes>
    </Suspense>
  );
}
