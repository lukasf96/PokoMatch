import { lazy } from "react";
import { appRoutes } from "./routes";

// Single source of truth for the route chunk imports so the router and the nav
// share the exact same dynamic import (one chunk), and so hovering a nav link
// can prefetch the chunk before navigation.
const importHome = () => import("../pages/Home/HomePage");
const importMatcher = () => import("../pages/MatchMaker/MatcherPage");
const importInsights = () => import("../pages/Insights/InsightsPage");
const importPokedex = () => import("../pages/Pokedex/PokedexPage");
const importHabitatGuide = () =>
  import("../pages/Guides/HabitatRoommateGuidePage");
const importSpecialtyGuide = () =>
  import("../pages/Guides/SpecialtyGroupsGuidePage");

export const HomePage = lazy(importHome);
export const MatcherPage = lazy(importMatcher);
export const InsightsPage = lazy(importInsights);
export const PokedexPage = lazy(importPokedex);
export const HabitatRoommateGuidePage = lazy(importHabitatGuide);
export const SpecialtyGroupsGuidePage = lazy(importSpecialtyGuide);

/** Kick off (and dedupe) the chunk download for a given route path. */
export const routePreloaders: Record<string, () => void> = {
  [appRoutes.home]: () => void importHome(),
  [appRoutes.matchmaker]: () => void importMatcher(),
  [appRoutes.insights]: () => void importInsights(),
  [appRoutes.pokedex]: () => void importPokedex(),
  [appRoutes.habitatGuide]: () => void importHabitatGuide(),
  [appRoutes.specialtyGuide]: () => void importSpecialtyGuide(),
};

export function preloadRoute(path: string): void {
  routePreloaders[path]?.();
}
