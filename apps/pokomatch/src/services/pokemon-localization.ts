import type { Pokemon } from "../types/types";

export type PokemonNameLanguage = "en" | "de" | "fr";

export function getPokemonDisplayName(
  pokemon: Pokemon,
  language: PokemonNameLanguage,
): string {
  if (language === "en") return pokemon.name;
  return pokemon.localizedNames?.[language] ?? pokemon.name;
}
