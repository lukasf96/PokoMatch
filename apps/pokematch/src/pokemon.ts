import rawData from './pokedex.json'
import type { Pokemon } from './types'

export const standardPokemon = rawData.standard as Pokemon[]
export const eventPokemon = rawData.event as Pokemon[]
export const allPokemon = [...standardPokemon, ...eventPokemon]
