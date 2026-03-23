import type { Pokemon } from "../types/types";
import { habitatConflictMap } from "./habitat-conflicts";

// ---------------------------------------------------------------------------
// Habitat compatibility — bitmask per pokemon.
// A pokemon's "conflict mask" is the bit of its opposite habitat.
// Candidate can join a group iff: groupConflictMask & habitatBit[candidate] === 0
// ---------------------------------------------------------------------------

const HABITAT_BIT: Record<string, number> = {
  Bright: 1 << 0,
  Dark: 1 << 1,
  Humid: 1 << 2,
  Dry: 1 << 3,
  Warm: 1 << 4,
  Cool: 1 << 5,
};

function habitatConflictBit(p: Pokemon): number {
  const opp = habitatConflictMap[p.idealHabitat];
  return opp ? HABITAT_BIT[opp] : 0;
}

function habitatBit(p: Pokemon): number {
  return HABITAT_BIT[p.idealHabitat] ?? 0;
}

export function canJoinGroup(group: Pokemon[], candidate: Pokemon): boolean {
  const cb = habitatBit(candidate);
  for (const m of group) if (habitatConflictBit(m) & cb) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Favorites affinity — 64-bit bitmask split across two 32-bit ints (lo/hi).
// Supports up to 64 distinct favorites (dataset has 43).
// sharedFavorites(a,b) = popcount(alo&blo) + popcount(ahi&bhi)
// ---------------------------------------------------------------------------

let _favVocab: Map<string, number> | null = null;
let _favLo: Int32Array | null = null;
let _favHi: Int32Array | null = null;

function buildVocab(pokemon: Pokemon[]): void {
  if (_favVocab) return;
  _favVocab = new Map();
  let bit = 0;
  for (const p of pokemon)
    for (const f of p.favorites) if (!_favVocab.has(f)) _favVocab.set(f, bit++);
}

function initBitmasks(pokemon: Pokemon[]): void {
  buildVocab(pokemon);
  const n = pokemon.length;
  _favLo = new Int32Array(n);
  _favHi = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    let lo = 0,
      hi = 0;
    for (const f of pokemon[i].favorites) {
      const b = _favVocab!.get(f);
      if (b !== undefined) {
        if (b < 32) lo |= 1 << b;
        else hi |= 1 << (b - 32);
      }
    }
    _favLo[i] = lo;
    _favHi[i] = hi;
  }
}

function popcount(x: number): number {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return (x * 0x01010101) >>> 24;
}

function sharedFav(alo: number, ahi: number, blo: number, bhi: number): number {
  return popcount(alo & blo) + popcount(ahi & bhi);
}

// ---------------------------------------------------------------------------
// Affinity + compatibility matrices
// ---------------------------------------------------------------------------

let _conflictBits: Int32Array;
let _habitatBits: Int32Array;

function buildHabitatArrays(pokemon: Pokemon[]): void {
  const n = pokemon.length;
  _conflictBits = new Int32Array(n);
  _habitatBits = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    _conflictBits[i] = habitatConflictBit(pokemon[i]);
    _habitatBits[i] = habitatBit(pokemon[i]);
  }
}

function buildAffinityMatrix(n: number): Int32Array {
  const aff = new Int32Array(n * n);
  for (let i = 0; i < n; i++) {
    const ilo = _favLo![i],
      ihi = _favHi![i];
    for (let j = i + 1; j < n; j++) {
      const v = sharedFav(ilo, ihi, _favLo![j], _favHi![j]);
      aff[i * n + j] = v;
      aff[j * n + i] = v;
    }
  }
  return aff;
}

interface Ctx {
  n: number;
  aff: Int32Array;
  compat: Uint8Array;
  affSum: Int32Array;
}

function buildCtx(pokemon: Pokemon[]): Ctx {
  const n = pokemon.length;
  initBitmasks(pokemon);
  const aff = buildAffinityMatrix(n);
  const compat = new Uint8Array(n * n);
  const affSum = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ok =
        !(_conflictBits[i] & _habitatBits[j]) &&
        !(_conflictBits[j] & _habitatBits[i])
          ? 1
          : 0;
      compat[i * n + j] = ok;
      compat[j * n + i] = ok;
      if (ok) {
        affSum[i] += aff[i * n + j];
        affSum[j] += aff[i * n + j];
      }
    }
  }

  return { n, aff, compat, affSum };
}

function totalScore(groups: Int32Array[], aff: Int32Array, n: number): number {
  let total = 0;
  for (const g of groups)
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) total += aff[g[i] * n + g[j]];
  return total;
}

function computeGreedy(order: Int32Array, ctx: Ctx): Int32Array[] {
  const { n, aff } = ctx;
  const assigned = new Uint8Array(n);
  const groups: Int32Array[] = [];

  for (let oi = 0; oi < order.length; oi++) {
    const first = order[oi];
    if (assigned[first]) continue;
    assigned[first] = 1;

    const g: number[] = [first];
    let gc = _conflictBits[first];
    let gh = _habitatBits[first];

    while (g.length < 4) {
      let bestIdx = -1,
        bestScore = -1;
      for (let oj = 0; oj < order.length; oj++) {
        const c = order[oj];
        if (assigned[c]) continue;
        if (gc & _habitatBits[c]) continue;
        if (_conflictBits[c] & gh) continue;
        let score = 0;
        for (let k = 0; k < g.length; k++) score += aff[c * n + g[k]];
        if (score > bestScore) {
          bestScore = score;
          bestIdx = oj;
        }
      }
      if (bestIdx < 0) break;
      const chosen = order[bestIdx];
      assigned[chosen] = 1;
      gc |= _conflictBits[chosen];
      gh |= _habitatBits[chosen];
      g.push(chosen);
    }

    groups.push(Int32Array.from(g));
  }

  return groups;
}

function improve(
  groups: Int32Array[],
  ctx: Ctx,
  deadlineMs: number,
): Int32Array[] {
  const { n, aff, compat } = ctx;
  const gs = groups.map((g) => Array.from(g));
  const MAX_PASSES = 20;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (Date.now() >= deadlineMs) break;
    let changed = false;

    for (let i = 0; i < gs.length; i++) {
      if (Date.now() >= deadlineMs) break;
      for (let j = i + 1; j < gs.length; j++) {
        if (Date.now() >= deadlineMs) break;
        const gA = gs[i],
          gB = gs[j];

        // swap
        for (let a = 0; a < gA.length; a++) {
          const left = gA[a];
          for (let b = 0; b < gB.length; b++) {
            const right = gB[b];
            let okA = true,
              okB = true;
            for (let k = 0; k < gA.length; k++) {
              if (k === a) continue;
              if (!compat[right * n + gA[k]]) {
                okA = false;
                break;
              }
            }
            if (!okA) continue;
            for (let k = 0; k < gB.length; k++) {
              if (k === b) continue;
              if (!compat[left * n + gB[k]]) {
                okB = false;
                break;
              }
            }
            if (!okB) continue;
            let dA = 0,
              dB = 0;
            for (let k = 0; k < gA.length; k++) {
              if (k !== a) dA += aff[right * n + gA[k]] - aff[left * n + gA[k]];
            }
            for (let k = 0; k < gB.length; k++) {
              if (k !== b) dB += aff[left * n + gB[k]] - aff[right * n + gB[k]];
            }
            if (dA + dB <= 0) continue;
            gA[a] = right;
            gB[b] = left;
            changed = true;
          }
        }

        // move A→B
        if (gA.length > 1 && gB.length < 4) {
          for (let a = 0; a < gA.length; a++) {
            const c = gA[a];
            let ok = true;
            for (let k = 0; k < gB.length; k++) {
              if (!compat[c * n + gB[k]]) {
                ok = false;
                break;
              }
            }
            if (!ok) continue;
            let delta = 0;
            for (let k = 0; k < gB.length; k++) delta += aff[c * n + gB[k]];
            for (let k = 0; k < gA.length; k++) {
              if (k !== a) delta -= aff[c * n + gA[k]];
            }
            if (delta <= 0) continue;
            gA.splice(a, 1);
            gB.push(c);
            changed = true;
            a--;
            if (gB.length >= 4 || gA.length <= 1) break;
          }
        }

        // move B→A
        if (gB.length > 1 && gA.length < 4) {
          for (let b = 0; b < gB.length; b++) {
            const c = gB[b];
            let ok = true;
            for (let k = 0; k < gA.length; k++) {
              if (!compat[c * n + gA[k]]) {
                ok = false;
                break;
              }
            }
            if (!ok) continue;
            let delta = 0;
            for (let k = 0; k < gA.length; k++) delta += aff[c * n + gA[k]];
            for (let k = 0; k < gB.length; k++) {
              if (k !== b) delta -= aff[c * n + gB[k]];
            }
            if (delta <= 0) continue;
            gB.splice(b, 1);
            gA.push(c);
            changed = true;
            b--;
            if (gA.length >= 4 || gB.length <= 1) break;
          }
        }
      }
    }

    if (!changed) break;
  }

  return gs.filter((g) => g.length > 0).map((g) => Int32Array.from(g));
}

function seededShuffle(n: number, seed: number): Int32Array {
  let state = seed >>> 0;
  const arr = new Int32Array(n);
  for (let i = 0; i < n; i++) arr[i] = i;
  for (let i = n - 1; i > 0; i--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Partition pokemon into groups of up to 4, maximising shared favorites
 * while respecting habitat conflicts.
 */
export function computeAutoGroups(pokemon: Pokemon[]): Pokemon[][] {
  if (pokemon.length === 0) return [];

  const n = pokemon.length;
  buildHabitatArrays(pokemon);
  const ctx = buildCtx(pokemon);

  const natural = new Int32Array(n).map((_, i) => i);
  const byAffDesc = Int32Array.from(natural).sort(
    (a, b) => ctx.affSum[b] - ctx.affSum[a],
  );
  const byAffAsc = Int32Array.from(byAffDesc).reverse();

  const randomCount = n > 220 ? 3 : 6;
  const seeds: Int32Array[] = [natural, byAffDesc, byAffAsc];
  for (let i = 0; i < randomCount; i++)
    seeds.push(seededShuffle(n, 12345 + i * 7919));

  // Phase 1: run all greedy seeds (fast), ranked by score
  type Candidate = { groups: Int32Array[]; score: number };
  const allGreedy: Candidate[] = seeds.map((seed) => {
    const groups = computeGreedy(seed, ctx);
    return { groups, score: totalScore(groups, ctx.aff, n) };
  });
  allGreedy.sort((a, b) => b.score - a.score);

  // Phase 2: improve candidates within time budget, best-first
  const deadline = Date.now() + 300;
  let best = allGreedy[0].groups;
  let bestScore = allGreedy[0].score;
  for (const candidate of allGreedy) {
    if (Date.now() >= deadline) break;
    const improved = improve(candidate.groups, ctx, deadline);
    const score = totalScore(improved, ctx.aff, n);
    if (score > bestScore) {
      bestScore = score;
      best = improved;
    }
  }

  return best.map((g) => Array.from(g).map((i) => pokemon[i]));
}

export interface SuggestedPokemon {
  pokemon: Pokemon;
  score: number;
}

export function suggestNextPokemon(
  group: Pokemon[],
  candidates: Pokemon[],
  limit = 4,
): SuggestedPokemon[] {
  if (group.length === 0) return [];

  const all = [...group, ...candidates];
  buildHabitatArrays(all);
  initBitmasks(all);
  const gLen = group.length;

  return candidates
    .map((pokemon, candidateIndex) => ({
      pokemon,
      allIndex: gLen + candidateIndex,
    }))
    .filter((entry) => {
      const idx = entry.allIndex;
      const cb = _habitatBits[idx];
      const candidateConflictBit = _conflictBits[idx];
      for (let k = 0; k < gLen; k++) {
        if (_conflictBits[k] & cb) return false;
        if (candidateConflictBit & _habitatBits[k]) return false;
      }
      return true;
    })
    .map((entry) => {
      const idx = entry.allIndex;
      let addedScore = 0;
      for (let k = 0; k < gLen; k++)
        addedScore += sharedFav(
          _favLo![k],
          _favHi![k],
          _favLo![idx],
          _favHi![idx],
        );
      return {
        pokemon: entry.pokemon,
        score: addedScore,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      const d = b.score - a.score;
      return d !== 0 ? d : a.pokemon.name.localeCompare(b.pokemon.name);
    })
    .slice(0, limit);
}

export function groupScore(group: Pokemon[]): number {
  if (group.length === 0) return 0;
  buildHabitatArrays(group);
  initBitmasks(group);
  const aff = buildAffinityMatrix(group.length);
  const n = group.length;
  let score = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) score += aff[i * n + j];
  return score;
}
