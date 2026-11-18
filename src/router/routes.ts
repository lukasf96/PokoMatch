interface AppRouteDefinition {
  path: string;
  title: string;
  description: string;
}

/** Public route manifest shared by client routing, prerendering, and metadata. */
export const appRouteDefinitions = {
  home: {
    path: "/",
    title: "PokoMatch | Pokémon Pokopia Habitat Planner & Roommate Matchmaker",
    description:
      "Free Pokopia habitat planner and roommate matchmaker for Pokémon Pokopia. Build compatible habitat groups and plan a happier island.",
  },
  matchmaker: {
    path: "/matchmaker",
    title: "Match Maker | Pokopia Habitat Roommate Planner — PokoMatch",
    description:
      "Find compatible Pokopia roommates with shared favorites and habitat fit. Build groups of up to four Pokémon with PokoMatch.",
  },
  insights: {
    path: "/insights",
    title: "Insights | Pokopia Habitats, Favorites & Items — PokoMatch",
    description:
      "Explore Pokopia habitats, favorites, specialties, and items to plan happier Pokémon homes.",
  },
  pokedex: {
    path: "/pokedex",
    title: "Pokédex | Standard, Event & Basin Dex for Pokopia — PokoMatch",
    description:
      "Browse and track Standard, Event, and Basin Pokémon in the Pokopia Pokédex.",
  },
  habitatGuide: {
    path: "/pokopia-habitat-roommates",
    title: "Pokopia Habitat & Roommate Compatibility Guide — PokoMatch",
    description:
      "A practical Pokopia habitat and roommate compatibility guide: avoid conflicts, match favorites, and plan homes that work.",
  },
  specialtyGuide: {
    path: "/pokopia-specialty-groups",
    title: "Pokopia Specialty Groups & Factory Guide — PokoMatch",
    description:
      "Plan practical Pokopia specialty groups and factory neighborhoods while keeping compatible Pokémon together.",
  },
} as const satisfies Record<string, AppRouteDefinition>;

export type AppRouteId = keyof typeof appRouteDefinitions;

export const appRouteEntries = Object.entries(appRouteDefinitions) as Array<
  [AppRouteId, (typeof appRouteDefinitions)[AppRouteId]]
>;

export const appRoutes = Object.fromEntries(
  appRouteEntries.map(([id, route]) => [id, route.path]),
) as {
  [Id in AppRouteId]: (typeof appRouteDefinitions)[Id]["path"];
};
