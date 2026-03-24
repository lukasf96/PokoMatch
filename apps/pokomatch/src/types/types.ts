export type Habitat = "Bright" | "Cool" | "Dark" | "Dry" | "Humid" | "Warm";

/** National dex entries vs. separate event dex listing in data. */
export type DexKind = "standard" | "event";

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
