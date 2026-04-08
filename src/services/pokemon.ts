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

/** Lower national-style dex first; other dex strings use numeric-aware locale order; ties use `id`. */
export function comparePokemonByDex(a: Pokemon, b: Pokemon): number {
  const da = a.dexNumber.trim();
  const db = b.dexNumber.trim();
  const aNum = /^\d+$/.test(da);
  const bNum = /^\d+$/.test(db);
  if (aNum && bNum) {
    const diff = Number.parseInt(da, 10) - Number.parseInt(db, 10);
    if (diff !== 0) return diff;
  } else {
    const c = da.localeCompare(db, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (c !== 0) return c;
  }
  return a.id.localeCompare(b.id);
}

const habitableStandardPokemon = standardPokemon.filter(isPokemonHabitable);
const habitableEventPokemon = eventPokemon.filter(isPokemonHabitable);
export const habitablePokemon = [
  ...habitableStandardPokemon,
  ...habitableEventPokemon,
];
