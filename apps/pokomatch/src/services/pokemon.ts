import rawData from "../assets/pokedex.json";
import type { DexKind, Pokemon } from "../types/types";

type PokemonJson = Omit<Pokemon, "dexKind">;

function withDexKind(entries: PokemonJson[], kind: DexKind): Pokemon[] {
  return entries.map((p) => ({ ...p, dexKind: kind }));
}

function isPokemonHabitable(pokemon: Pokemon): boolean {
  return pokemon.isHabitable !== false;
}

export const standardPokemon = withDexKind(
  rawData.standard as PokemonJson[],
  "standard",
);
export const eventPokemon = withDexKind(
  rawData.event as PokemonJson[],
  "event",
);
export const allPokemon = [...standardPokemon, ...eventPokemon];

/** True when the species is listed under the event dex (see `eventPokemon`). */
export function isEventDexPokemon(pokemon: Pokemon): boolean {
  return pokemon.dexKind === "event";
}

export const habitableStandardPokemon =
  standardPokemon.filter(isPokemonHabitable);
export const habitableEventPokemon = eventPokemon.filter(isPokemonHabitable);
export const habitablePokemon = [
  ...habitableStandardPokemon,
  ...habitableEventPokemon,
];
