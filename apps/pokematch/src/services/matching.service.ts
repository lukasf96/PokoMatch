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

interface ExactSolveResult {
  score: number;
  groups: number[][];
}

function canJoinIndexedGroup(
  group: number[],
  candidateIndex: number,
  pokemon: Pokemon[],
): boolean {
  const candidate = pokemon[candidateIndex];
  return group.every((memberIndex) =>
    canJoinGroup([pokemon[memberIndex]], candidate),
  );
}

function scoreIndexedGroup(group: number[], affinity: number[][]): number {
  let score = 0;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      score += affinity[group[i]][group[j]];
    }
  }
  return score;
}

function buildAffinityMatrix(pokemon: Pokemon[]): number[][] {
  const size = pokemon.length;
  const affinity = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const score = sharedFavorites(pokemon[i], pokemon[j]);
      affinity[i][j] = score;
      affinity[j][i] = score;
    }
  }
  return affinity;
}

function solveExactGroups(pokemon: Pokemon[]): Pokemon[][] {
  const affinity = buildAffinityMatrix(pokemon);
  const all = Array.from({ length: pokemon.length }, (_, index) => index);
  const memo = new Map<string, ExactSolveResult>();

  function keyOf(indices: number[]): string {
    return indices.join(",");
  }

  function solve(remaining: number[]): ExactSolveResult {
    if (remaining.length === 0) return { score: 0, groups: [] };
    const memoKey = keyOf(remaining);
    const memoValue = memo.get(memoKey);
    if (memoValue) return memoValue;

    const first = remaining[0];
    const rest = remaining.slice(1);
    const candidateGroups: number[][] = [[first]];

    for (let a = 0; a < rest.length; a++) {
      const g2 = [first, rest[a]];
      if (!canJoinIndexedGroup([first], rest[a], pokemon)) continue;
      candidateGroups.push(g2);
      for (let b = a + 1; b < rest.length; b++) {
        const g3 = [first, rest[a], rest[b]];
        if (!canJoinIndexedGroup(g2, rest[b], pokemon)) continue;
        candidateGroups.push(g3);
        for (let c = b + 1; c < rest.length; c++) {
          if (!canJoinIndexedGroup(g3, rest[c], pokemon)) continue;
          candidateGroups.push([first, rest[a], rest[b], rest[c]]);
        }
      }
    }

    let best: ExactSolveResult = { score: -1, groups: [] };
    for (const group of candidateGroups) {
      const chosen = new Set(group);
      const nextRemaining = remaining.filter((index) => !chosen.has(index));
      const next = solve(nextRemaining);
      const score = scoreIndexedGroup(group, affinity) + next.score;
      if (score > best.score) {
        best = { score, groups: [group, ...next.groups] };
      }
    }

    memo.set(memoKey, best);
    return best;
  }

  const solved = solve(all);
  return solved.groups.map((group) => group.map((index) => pokemon[index]));
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  let state = seed >>> 0;
  const next = [...items];

  function rand(): number {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  }

  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

interface LargeSolverContext {
  affinity: number[][];
  compatible: boolean[][];
  affinitySums: number[];
}

function buildLargeSolverContext(pokemon: Pokemon[]): LargeSolverContext {
  const size = pokemon.length;
  const affinity = buildAffinityMatrix(pokemon);
  const compatible = Array.from({ length: size }, () => Array(size).fill(true));
  const affinitySums = Array(size).fill(0);

  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const isCompatible = canJoinGroup([pokemon[i]], pokemon[j]);
      compatible[i][j] = isCompatible;
      compatible[j][i] = isCompatible;
      if (isCompatible) {
        affinitySums[i] += affinity[i][j];
        affinitySums[j] += affinity[i][j];
      }
    }
  }

  return { affinity, compatible, affinitySums };
}

function groupScoreByIndex(group: number[], affinity: number[][]): number {
  let score = 0;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      score += affinity[group[i]][group[j]];
    }
  }
  return score;
}

function totalIndexedScore(groups: number[][], affinity: number[][]): number {
  return groups.reduce((sum, group) => sum + groupScoreByIndex(group, affinity), 0);
}

function contributionToGroup(
  candidate: number,
  group: number[],
  affinity: number[][],
  skipIndex = -1,
): number {
  let contribution = 0;
  for (let i = 0; i < group.length; i++) {
    if (i === skipIndex) continue;
    contribution += affinity[candidate][group[i]];
  }
  return contribution;
}

function canInsertIntoGroup(
  candidate: number,
  group: number[],
  compatible: boolean[][],
  skipIndex = -1,
): boolean {
  for (let i = 0; i < group.length; i++) {
    if (i === skipIndex) continue;
    if (!compatible[candidate][group[i]]) return false;
  }
  return true;
}

function computeGreedyGroupsFromOrder(
  orderedIndices: number[],
  context: LargeSolverContext,
): number[][] {
  const remaining = [...orderedIndices];
  const groups: number[][] = [];

  while (remaining.length > 0) {
    const group: number[] = [remaining.shift()!];
    while (group.length < 4 && remaining.length > 0) {
      let bestIdx = -1;
      let bestScore = -1;
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        if (!canInsertIntoGroup(candidate, group, context.compatible)) continue;
        const score = contributionToGroup(candidate, group, context.affinity);
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

function improveIndexedGroups(
  initialGroups: number[][],
  context: LargeSolverContext,
  deadlineMs: number,
): number[][] {
  const groups = initialGroups.map((group) => [...group]);
  const maxPasses = 4;

  for (let pass = 0; pass < maxPasses; pass++) {
    if (Date.now() >= deadlineMs) break;
    let changed = false;

    for (let i = 0; i < groups.length; i++) {
      if (Date.now() >= deadlineMs) break;
      for (let j = i + 1; j < groups.length; j++) {
        if (Date.now() >= deadlineMs) break;
        const groupA = groups[i];
        const groupB = groups[j];

        for (let a = 0; a < groupA.length; a++) {
          const left = groupA[a];

          for (let b = 0; b < groupB.length; b++) {
            const right = groupB[b];
            if (
              !canInsertIntoGroup(right, groupA, context.compatible, a) ||
              !canInsertIntoGroup(left, groupB, context.compatible, b)
            ) {
              continue;
            }

            const deltaA =
              contributionToGroup(right, groupA, context.affinity, a) -
              contributionToGroup(left, groupA, context.affinity, a);
            const deltaB =
              contributionToGroup(left, groupB, context.affinity, b) -
              contributionToGroup(right, groupB, context.affinity, b);
            if (deltaA + deltaB <= 0) continue;

            groupA[a] = right;
            groupB[b] = left;
            changed = true;
          }
        }

        if (groupA.length > 1 && groupB.length < 4) {
          for (let a = 0; a < groupA.length; a++) {
            const candidate = groupA[a];
            if (!canInsertIntoGroup(candidate, groupB, context.compatible))
              continue;
            const delta =
              contributionToGroup(candidate, groupB, context.affinity) -
              contributionToGroup(candidate, groupA, context.affinity, a);
            if (delta <= 0) continue;
            groupA.splice(a, 1);
            groupB.push(candidate);
            changed = true;
            a--;
            if (groupB.length >= 4 || groupA.length <= 1) break;
          }
        }

        if (groupB.length > 1 && groupA.length < 4) {
          for (let b = 0; b < groupB.length; b++) {
            const candidate = groupB[b];
            if (!canInsertIntoGroup(candidate, groupA, context.compatible))
              continue;
            const delta =
              contributionToGroup(candidate, groupA, context.affinity) -
              contributionToGroup(candidate, groupB, context.affinity, b);
            if (delta <= 0) continue;
            groupB.splice(b, 1);
            groupA.push(candidate);
            changed = true;
            b--;
            if (groupA.length >= 4 || groupB.length <= 1) break;
          }
        }
      }
    }

    if (!changed) break;
  }

  return groups.filter((group) => group.length > 0);
}

function solveLargeInput(pokemon: Pokemon[]): Pokemon[][] {
  const context = buildLargeSolverContext(pokemon);
  const indices = Array.from({ length: pokemon.length }, (_, index) => index);
  const byAffinityDesc = [...indices].sort(
    (a, b) => context.affinitySums[b] - context.affinitySums[a],
  );
  const byAffinityAsc = [...byAffinityDesc].reverse();

  const seeds: number[][] = [indices, byAffinityDesc, byAffinityAsc];
  const randomSeedCount = pokemon.length > 220 ? 2 : 4;
  for (let i = 0; i < randomSeedCount; i++) {
    seeds.push(seededShuffle(indices, 12345 + i * 7919));
  }

  const deadlineMs = Date.now() + 220;
  let bestGroups: number[][] = computeGreedyGroupsFromOrder(indices, context);
  let bestScore = totalIndexedScore(bestGroups, context.affinity);

  for (const seed of seeds) {
    if (Date.now() >= deadlineMs) break;
    const greedy = computeGreedyGroupsFromOrder(seed, context);
    const improved = improveIndexedGroups(greedy, context, deadlineMs);
    const score = totalIndexedScore(improved, context.affinity);
    if (score > bestScore) {
      bestScore = score;
      bestGroups = improved;
    }
  }

  return bestGroups.map((group) => group.map((index) => pokemon[index]));
}

/**
 * Greedily build groups of up to 4 from all available pokemon.
 * Tries to maximize shared favorites while enforcing habitat conflicts.
 */
export function computeAutoGroups(pokemon: Pokemon[]): Pokemon[][] {
  if (pokemon.length <= 18) return solveExactGroups(pokemon);
  return solveLargeInput(pokemon);
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
