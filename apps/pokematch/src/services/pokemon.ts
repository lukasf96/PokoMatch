import rawData from "../assets/pokedex.json";
import type { Pokemon } from "../types/types";

function isPokemonHabitable(pokemon: Pokemon): boolean {
  return pokemon.isHabitable !== false;
}

export const standardPokemon = rawData.standard as Pokemon[];
export const eventPokemon = rawData.event as Pokemon[];
export const allPokemon = [...standardPokemon, ...eventPokemon];

export const habitableStandardPokemon =
  standardPokemon.filter(isPokemonHabitable);
export const habitableEventPokemon = eventPokemon.filter(isPokemonHabitable);
export const habitablePokemon = [
  ...habitableStandardPokemon,
  ...habitableEventPokemon,
];
