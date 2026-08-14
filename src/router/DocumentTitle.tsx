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
  [appRoutes.habitatGuide]:
    "Pokopia Habitat & Roommate Compatibility Guide — PokoMatch",
  [appRoutes.specialtyGuide]:
    "Pokopia Specialty Groups & Factory Guide — PokoMatch",
};

const defaultDescription =
  "Free Pokopia habitat planner and roommate matchmaker for Pokémon Pokopia. Build compatible habitat groups and plan a happier island.";

const routeDescriptions: Record<string, string> = {
  [appRoutes.home]: defaultDescription,
  [appRoutes.matchmaker]:
    "Find compatible Pokopia roommates with shared favorites and habitat fit. Build groups of up to four Pokémon with PokoMatch.",
  [appRoutes.insights]:
    "Explore Pokopia habitats, favorites, specialties, and items to plan happier Pokémon homes.",
  [appRoutes.pokedex]:
    "Browse and track Standard, Event, and Basin Pokémon in the Pokopia Pokédex.",
  [appRoutes.habitatGuide]:
    "A practical Pokopia habitat and roommate compatibility guide: avoid conflicts, match favorites, and plan homes that work.",
  [appRoutes.specialtyGuide]:
    "Plan practical Pokopia specialty groups and factory neighborhoods while keeping compatible Pokémon together.",
};

function setMeta(selector: string, attribute: "name" | "property", value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.content = value;
  else {
    const meta = document.createElement("meta");
    meta.setAttribute(attribute, selector.match(/"([^"]+)"/)?.[1] ?? "");
    meta.content = value;
    document.head.append(meta);
  }
}

/** Sets document.title from the current route (SPA-friendly; no extra deps). */
export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = routeTitles[pathname] ?? DEFAULT_TITLE;
    const description = routeDescriptions[pathname] ?? defaultDescription;
    const canonicalUrl = `https://pokomatch.com${pathname === "/" ? "/" : pathname}`;

    document.title = title;
    setMeta('meta[name="description"]', "name", description);
    setMeta('meta[property="og:title"]', "property", title);
    setMeta('meta[property="og:description"]', "property", description);
    setMeta('meta[property="og:url"]', "property", canonicalUrl);
    setMeta('meta[name="twitter:title"]', "name", title);
    setMeta('meta[name="twitter:description"]', "name", description);

    const canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) canonical.href = canonicalUrl;
  }, [pathname]);

  return null;
}
