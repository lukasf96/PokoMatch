import type { Pokemon } from "../types/types";
import { canJoinGroup } from "./habitat-conflicts";

/**
 * Score how well two pokemon match based on shared favorites.
 * Higher = better match.
 */
function sharedFavorites(a: Pokemon, b: Pokemon): number {
  const setB = new Set(b.favorites);
  return a.favorites.filter((f) => setB.has(f)).length;
}

function candidateScore(group: Pokemon[], candidate: Pokemon): number {
  return group.reduce((sum, p) => sum + sharedFavorites(p, candidate), 0);
}

/**
 * Score a candidate group by summing all pairwise shared favorites.
 */
function groupScore(group: Pokemon[]): number {
  let score = 0;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      score += sharedFavorites(group[i], group[j]);
    }
  }
  return score;
}

/**
 * Greedily build groups of up to 4 from all available pokemon.
 * Tries to maximize shared favorites while enforcing habitat conflicts.
 */
export function computeAutoGroups(pokemon: Pokemon[]): Pokemon[][] {
  const remaining = [...pokemon];
  const groups: Pokemon[][] = [];

  while (remaining.length > 0) {
    const group: Pokemon[] = [remaining.shift()!];

    while (group.length < 4 && remaining.length > 0) {
      // Find the remaining pokemon that best improves the current group
      // without violating habitat conflict constraints.
      let bestIdx = -1;
      let bestScore = -1;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        if (!canJoinGroup(group, candidate)) continue;
        const score = candidateScore(group, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx < 0) break;
      group.push(remaining.splice(bestIdx, 1)[0]);
    }

    groups.push(group);
  }

  return groups;
}

export function suggestNextPokemon(
  group: Pokemon[],
  candidates: Pokemon[],
  limit = 4,
): Pokemon[] {
  if (group.length === 0) return [];
  return [...candidates]
    .filter((candidate) => canJoinGroup(group, candidate))
    .sort((a, b) => {
      const scoreDiff = candidateScore(group, b) - candidateScore(group, a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export { groupScore };
