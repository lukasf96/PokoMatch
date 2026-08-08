export type Habitat = "Bright" | "Cool" | "Dark" | "Dry" | "Humid" | "Warm";

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
