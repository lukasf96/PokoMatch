import type { Pokemon } from "../../types/types";

const SHARE_PARAMETER = "group";

export interface SharedGroup {
  pokemonIds: string[];
}

/** A compact, URL-safe group payload. It contains game data only—never a save or user identity. */
export function createSharedGroupUrl(
  group: Pick<SharedGroup, "pokemonIds">,
  origin = window.location.origin,
): string {
  const url = new URL("/matchmaker", origin);
  url.searchParams.set(SHARE_PARAMETER, group.pokemonIds.join(","));
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

  return { pokemonIds };
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
