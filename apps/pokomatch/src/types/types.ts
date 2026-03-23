export type Habitat = 'Bright' | 'Cool' | 'Dark' | 'Dry' | 'Humid' | 'Warm'

export interface PokemonLocalizedNames {
  de: string
  fr: string
}

export interface Pokemon {
  id: string
  dexNumber: string
  name: string
  localizedNames?: PokemonLocalizedNames
  specialties: string[]
  idealHabitat: Habitat
  favorites: string[]
  favoriteFlavor?: string
  isHabitable?: boolean
}
