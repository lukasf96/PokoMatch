import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { appRoutes } from "./routes";

const DEFAULT_TITLE =
  "PokoMatch | Pokémon Pokopia Habitat Planner & Roommate Matchmaker";

const routeTitles: Record<string, string> = {
  [appRoutes.home]: DEFAULT_TITLE,
  [appRoutes.matchmaker]:
    "Match Maker | Pokopia Habitat Roommate Planner — PokoMatch",
  [appRoutes.insights]:
    "Insights | Pokopia Habitats, Favorites & Items — PokoMatch",
  [appRoutes.pokedex]:
    "Pokédex | Standard, Event & Basin Dex for Pokopia — PokoMatch",
};

/** Sets document.title from the current route (SPA-friendly; no extra deps). */
export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = routeTitles[pathname] ?? DEFAULT_TITLE;
  }, [pathname]);

  return null;
}
