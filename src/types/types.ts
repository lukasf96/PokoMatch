export type Habitat = "Bright" | "Cool" | "Dark" | "Dry" | "Humid" | "Warm";

/** Pokopia overworld locations (Cloud Island excluded — separate world/save). */
export const POKOPIA_LOCATIONS = [
  "Withered Wastelands",
  "Bleak Beach",
  "Rocky Ridges",
  "Sparkling Skylands",
  "Palette Town",
  "Bubbly Basin",
] as const;

export type PokopiaLocation = (typeof POKOPIA_LOCATIONS)[number];

/** User-built Match Maker group. Array order in the store is the display order. */
export interface CustomGroup {
  id: string;
  pokemonIds: string[];
  /** Optional Pokopia location; omit/undefined means unassigned. */
  location?: PokopiaLocation;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  tag: string;
  favoriteCategories: string[];
}

export interface SuggestedItem {
  item: Item;
  /** Number of the item's favoriteCategories that overlap with the group's favorites union. */
  score: number;
  /** Number of Pokémon in the group that have at least one favorite satisfied by this item. */
  pokemonCoverage: number;
}

/** Standard Pokopia dex vs. separate event / Basin (DLC) listings in data. */
export type DexKind = "standard" | "event" | "basin";

export interface PokemonLocalizedNames {
  de: string;
  fr: string;
}

export interface Pokemon {
  dexKind: DexKind;
  id: string;
  dexNumber: string;
  name: string;
  localizedNames?: PokemonLocalizedNames;
  evolutionLinePeerIds?: string[];
  specialties: string[];
  idealHabitat: Habitat;
  favorites: string[];
  favoriteFlavor?: string;
  isHabitable?: boolean;
}
