import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type {
  AutoGroupsRequest,
  AutoGroupsResponse,
} from "../../services/matching.worker";
import type { Pokemon } from "../../types/types";

export interface UseAutoGroupsResult {
  /** Latest computed groups. Previous results stay visible while recomputing. */
  groups: Pokemon[][];
  /** True while a fresh computation is in flight (stale results are shown). */
  isRecomputing: boolean;
}

/**
 * Computes auto-groups in a Web Worker, keeping the previous results on screen
 * while a new computation runs. This keeps every interaction on the Match Maker
 * page instant even though `computeAutoGroups` can block for ~60–300ms.
 */
export function useAutoGroups(
  autoPokemon: Pokemon[],
  preferEvolutionLines: boolean,
): UseAutoGroupsResult {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [groups, setGroups] = useState<Pokemon[][]>([]);
  const [isRecomputing, setIsRecomputing] = useState(true);
  const [, startTransition] = useTransition();

  const requestIdRef = useRef(0);
  /** id → Pokémon lookups captured per request, so responses map to real objects. */
  const lookupByRequestRef = useRef(new Map<number, Map<string, Pokemon>>());
  const autoPokemonRef = useRef(autoPokemon);
  autoPokemonRef.current = autoPokemon;

  // Own the worker's lifecycle. Recreated on remount (incl. StrictMode) so it
  // is always live when we post to it.
  useEffect(() => {
    const instance = new Worker(
      new URL("../../services/matching.worker.ts", import.meta.url),
      { type: "module" },
    );
    setWorker(instance);
    return () => {
      instance.terminate();
      setWorker(null);
    };
  }, []);

  useEffect(() => {
    if (!worker) return;
    const handleMessage = (event: MessageEvent<AutoGroupsResponse>) => {
      const { requestId, groupIds } = event.data;
      const lookup = lookupByRequestRef.current.get(requestId);
      lookupByRequestRef.current.delete(requestId);
      // Ignore results for superseded requests.
      if (requestId !== requestIdRef.current) return;

      const mapped = groupIds.map((ids) =>
        ids
          .map((id) => lookup?.get(id))
          .filter((p): p is Pokemon => p !== undefined),
      );
      // Render the (potentially large) new list as a non-urgent transition so
      // it can be interrupted by user interactions and never blocks input.
      startTransition(() => {
        setGroups(mapped);
        setIsRecomputing(false);
      });
    };
    worker.addEventListener("message", handleMessage);
    return () => worker.removeEventListener("message", handleMessage);
  }, [worker]);

  // A stable content key so we only recompute when the pool or preference
  // actually changes (autoPokemon is a fresh array on every render).
  const pokemonIds = useMemo(
    () => autoPokemon.map((p) => p.id),
    [autoPokemon],
  );
  const idsKey = pokemonIds.join("|");

  useEffect(() => {
    if (!worker) return;
    const requestId = ++requestIdRef.current;

    const lookup = new Map<string, Pokemon>();
    for (const pokemon of autoPokemonRef.current) lookup.set(pokemon.id, pokemon);
    lookupByRequestRef.current.set(requestId, lookup);

    setIsRecomputing(true);
    const request: AutoGroupsRequest = {
      requestId,
      pokemonIds: idsKey.length === 0 ? [] : idsKey.split("|"),
      preferEvolutionLines,
    };
    worker.postMessage(request);
    // idsKey encodes autoPokemon's contents; read via ref to avoid churn.
  }, [worker, idsKey, preferEvolutionLines]);

  return { groups, isRecomputing };
}
