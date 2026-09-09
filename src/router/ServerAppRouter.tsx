import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import HabitatRoommateGuidePage from "../pages/Guides/HabitatRoommateGuidePage";
import SpecialtyGroupsGuidePage from "../pages/Guides/SpecialtyGroupsGuidePage";
import HomePage from "../pages/Home/HomePage";
import InsightsPage from "../pages/Insights/InsightsPage";
import MatcherPage from "../pages/MatchMaker/MatcherPage";
import PokedexPage from "../pages/Pokedex/PokedexPage";
import { appRoutes } from "./routes";

/** Eager route tree used only while generating HTML at build time. */
export function ServerAppRouter() {
  return (
    // Match the client boundary even though these build-time imports are eager.
    <Suspense fallback={null}>
      <Routes>
        <Route path={appRoutes.home} element={<HomePage />} />
        <Route path={appRoutes.matchmaker} element={<MatcherPage />} />
        <Route path={appRoutes.insights} element={<InsightsPage />} />
        <Route path={appRoutes.pokedex} element={<PokedexPage />} />
        <Route path={appRoutes.habitatGuide} element={<HabitatRoommateGuidePage />} />
        <Route path={appRoutes.specialtyGuide} element={<SpecialtyGroupsGuidePage />} />
      </Routes>
    </Suspense>
  );
}
