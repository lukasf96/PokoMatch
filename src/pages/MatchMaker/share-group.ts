import type { Pokemon, PokopiaLocation } from "../../types/types";

const SHARE_PARAMETER = "group";

export interface SharedGroup {
  pokemonIds: string[];
  location?: PokopiaLocation;
}

/** A compact, URL-safe group payload. It contains game data only—never a save or user identity. */
export function createSharedGroupUrl(
  group: Pick<SharedGroup, "pokemonIds" | "location">,
  origin = window.location.origin,
): string {
  const url = new URL("/matchmaker", origin);
  url.searchParams.set(SHARE_PARAMETER, group.pokemonIds.join(","));
  if (group.location) url.searchParams.set("location", group.location);
  return url.toString();
}

export function readSharedGroup(
  search: string,
  availablePokemon: readonly Pokemon[],
): SharedGroup | null {
  const params = new URLSearchParams(search);
  const rawIds = params.get(SHARE_PARAMETER);
  if (!rawIds) return null;

  const knownIds = new Set(availablePokemon.map((pokemon) => pokemon.id));
  const pokemonIds = [...new Set(rawIds.split(","))]
    .filter((id) => knownIds.has(id))
    .slice(0, 4);
  if (pokemonIds.length === 0) return null;

  const location = params.get("location") ?? undefined;
  return {
    pokemonIds,
    // Location is descriptive in-game data, but only accept values which exist in the app.
    ...(location && [
      "Withered Wastelands",
      "Bleak Beach",
      "Rocky Ridges",
      "Sparkling Skylands",
      "Palette Town",
      "Bubbly Basin",
    ].includes(location)
      ? { location: location as PokopiaLocation }
      : {}),
  };
}

export async function copySharedGroupUrl(url: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }
  const input = document.createElement("textarea");
  input.value = url;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}
