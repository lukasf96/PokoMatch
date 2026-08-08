/// <reference lib="webworker" />
// Runs the expensive auto-grouping off the main thread so the Match Maker UI
// stays responsive while results are (re)computed. Messages carry only Pokémon
// ids — the worker owns its own copy of the dex and maps ids back to full
// objects, so payloads stay tiny and object identity is resolved on the caller
// side.
import { computeAutoGroups } from "./matching.service";
import { habitablePokemon } from "./pokemon";
import type { Pokemon } from "../types/types";

export interface AutoGroupsRequest {
  requestId: number;
  pokemonIds: string[];
  preferEvolutionLines: boolean;
}

export interface AutoGroupsResponse {
  requestId: number;
  /** Groups as id arrays, preserving the service's group + member ordering. */
  groupIds: string[][];
}

const pokemonById = new Map<string, Pokemon>();
for (const pokemon of habitablePokemon) pokemonById.set(pokemon.id, pokemon);

self.onmessage = (event: MessageEvent<AutoGroupsRequest>) => {
  const { requestId, pokemonIds, preferEvolutionLines } = event.data;

  const pokemon = pokemonIds
    .map((id) => pokemonById.get(id))
    .filter((p): p is Pokemon => p !== undefined);

  const groups = computeAutoGroups(pokemon, { preferEvolutionLines });
  const groupIds = groups.map((group) => group.map((p) => p.id));

  const response: AutoGroupsResponse = { requestId, groupIds };
  self.postMessage(response);
};
