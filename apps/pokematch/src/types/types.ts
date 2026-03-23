export type Habitat = 'Bright' | 'Cool' | 'Dark' | 'Dry' | 'Humid' | 'Warm'

export interface Pokemon {
  id: string
  dexNumber: string
  name: string
  specialties: string[]
  idealHabitat: Habitat
  favorites: string[]
  favoriteFlavor?: string
  isHabitable?: boolean
}
