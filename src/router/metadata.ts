import { appRoutes } from "./routes";

const DEFAULT_TITLE =
  "PokoMatch | Pokémon Pokopia Habitat Planner & Roommate Matchmaker";

const defaultDescription =
  "Free Pokopia habitat planner and roommate matchmaker for Pokémon Pokopia. Build compatible habitat groups and plan a happier island.";

const metadataByPath: Record<string, { title: string; description: string }> = {
  [appRoutes.home]: {
    title: DEFAULT_TITLE,
    description: defaultDescription,
  },
  [appRoutes.matchmaker]: {
    title: "Match Maker | Pokopia Habitat Roommate Planner — PokoMatch",
    description:
      "Find compatible Pokopia roommates with shared favorites and habitat fit. Build groups of up to four Pokémon with PokoMatch.",
  },
  [appRoutes.insights]: {
    title: "Insights | Pokopia Habitats, Favorites & Items — PokoMatch",
    description:
      "Explore Pokopia habitats, favorites, specialties, and items to plan happier Pokémon homes.",
  },
  [appRoutes.pokedex]: {
    title: "Pokédex | Standard, Event & Basin Dex for Pokopia — PokoMatch",
    description:
      "Browse and track Standard, Event, and Basin Pokémon in the Pokopia Pokédex.",
  },
  [appRoutes.habitatGuide]: {
    title: "Pokopia Habitat & Roommate Compatibility Guide — PokoMatch",
    description:
      "A practical Pokopia habitat and roommate compatibility guide: avoid conflicts, match favorites, and plan homes that work.",
  },
  [appRoutes.specialtyGuide]: {
    title: "Pokopia Specialty Groups & Factory Guide — PokoMatch",
    description:
      "Plan practical Pokopia specialty groups and factory neighborhoods while keeping compatible Pokémon together.",
  },
};

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
}

export function getPageMetadata(pathname: string): PageMetadata {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const metadata = metadataByPath[normalizedPath] ?? {
    title: DEFAULT_TITLE,
    description: defaultDescription,
  };
  return {
    ...metadata,
    canonicalUrl: `https://pokomatch.com${
      normalizedPath === "/" ? "/" : normalizedPath
    }`,
  };
}

export const prerenderRoutes = Object.keys(metadataByPath);
