import type { Pokemon } from "../types/types";
import { habitatConflictMap } from "./habitat-conflicts";
import { comparePokemonByDex } from "./pokemon";

// ---------------------------------------------------------------------------
// The problem
// ---------------------------------------------------------------------------
// Partition all input Pokémon into groups of size 1..4 to maximise the sum, over
// every group, of the sum over every unordered pair of `sharedFavorites(a, b)`
// (0..5) — plus a small evolution-line bonus per pair when `preferEvolutionLines`
// is on. Hard constraint: two Pokémon with OPPOSITE ideal habitats may never share
// a group. This is max-weight capacitated clique partitioning (NP-hard), but the
// instances are small (≤ ~365) and low-weight, so a good construction + local
// search + iterated local search within a time budget gets us at/near optimal fast.
//
// All per-call state is local (no module-level caches) so results are always
// correct regardless of which/how many Pokémon are passed across calls.

// ---------------------------------------------------------------------------
// Habitat compatibility — bitmask per Pokémon.
// A Pokémon's "conflict bit" is the bit of its opposite habitat; a candidate may
// join a group iff none of its habitat bits hit the group's accumulated conflict
// bits and vice-versa.
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

// ---------------------------------------------------------------------------
// Favorites affinity — 64-bit bitmask split across two 32-bit ints (lo/hi).
// The dex has 45 distinct favorites, comfortably under 64. sharedFavorites is a
// popcount of the intersection.
// ---------------------------------------------------------------------------

interface FavMasks {
  lo: Int32Array;
  hi: Int32Array;
}

/** Build favorite bitmasks with a vocabulary local to this exact Pokémon set. */
function buildFavMasks(pokemon: Pokemon[]): FavMasks {
  const vocab = new Map<string, number>();
  let nextBit = 0;
  const n = pokemon.length;
  const lo = new Int32Array(n);
  const hi = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    for (const f of pokemon[i].favorites) {
      let b = vocab.get(f);
      if (b === undefined) {
        b = nextBit++;
        vocab.set(f, b);
      }
      if (b < 32) lo[i] |= 1 << b;
      else if (b < 64) hi[i] |= 1 << (b - 32);
    }
  }
  return { lo, hi };
}

function popcount(x: number): number {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return (x * 0x01010101) >>> 24;
}

function sharedFav(masks: FavMasks, i: number, j: number): number {
  return (
    popcount(masks.lo[i] & masks.lo[j]) + popcount(masks.hi[i] & masks.hi[j])
  );
}

// ---------------------------------------------------------------------------
// Model — all matrices/arrays needed by construction and local search.
// ---------------------------------------------------------------------------

const EVOLUTION_LINE_PAIR_BONUS = 2;
const TIME_BUDGET_MS = 300;
/** Stop the search early once this long has passed with no improvement (keeps easy/small inputs snappy). */
const STALL_MS = 60;
/** Only the strongest partners of each Pokémon are considered when building seed edges. */
const NEIGHBOR_K = 20;

interface Model {
  n: number;
  /** Raw shared-favorites per ordered pair (objective weight, symmetric). */
  aff: Int32Array;
  /** Optimisation weight: aff plus optional evolution-line bonus (symmetric). */
  scoreAff: Int32Array;
  /** 1 if the two Pokémon may legally share a group. */
  compat: Uint8Array;
  conflictBit: Int32Array;
  habitatBit: Int32Array;
}

function buildModel(pokemon: Pokemon[], preferEvolutionLines: boolean): Model {
  const n = pokemon.length;
  const masks = buildFavMasks(pokemon);

  const conflictBit = new Int32Array(n);
  const habitatBit_ = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    conflictBit[i] = habitatConflictBit(pokemon[i]);
    habitatBit_[i] = habitatBit(pokemon[i]);
  }

  const hasEvolutionData = pokemon.some(
    (p) => (p.evolutionLinePeerIds?.length ?? 0) > 0,
  );
  const useEvo = preferEvolutionLines && hasEvolutionData;
  const peerSets = useEvo
    ? pokemon.map((p) => new Set(p.evolutionLinePeerIds ?? []))
    : null;

  const aff = new Int32Array(n * n);
  const scoreAff = new Int32Array(n * n);
  const compat = new Uint8Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const w = sharedFav(masks, i, j);
      aff[i * n + j] = w;
      aff[j * n + i] = w;
      let sw = w;
      if (peerSets && peerSets[i].has(pokemon[j].id))
        sw += EVOLUTION_LINE_PAIR_BONUS;
      scoreAff[i * n + j] = sw;
      scoreAff[j * n + i] = sw;
      const ok =
        !(conflictBit[i] & habitatBit_[j]) && !(conflictBit[j] & habitatBit_[i])
          ? 1
          : 0;
      compat[i * n + j] = ok;
      compat[j * n + i] = ok;
    }
  }

  return { n, aff, scoreAff, compat, conflictBit, habitatBit: habitatBit_ };
}

// ---------------------------------------------------------------------------
// Scoring helpers over index-based groups.
// ---------------------------------------------------------------------------

function totalScore(groups: number[][], weight: Int32Array, n: number): number {
  let total = 0;
  for (const g of groups)
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++)
        total += weight[g[i] * n + g[j]];
  return total;
}

/** True if `v` may join `g` (habitat-compatible with every current member). */
function canJoin(g: number[], v: number, model: Model): boolean {
  const { n, compat } = model;
  for (let k = 0; k < g.length; k++) if (!compat[v * n + g[k]]) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Construction — edge-greedy agglomerative merge.
// Since every feasible merge only adds non-negative cross edges, we merge groups
// starting from the heaviest pair edges (a savings-style heuristic), which packs
// strong 3–4 cliques early. Local search then repairs capacity mistakes.
// ---------------------------------------------------------------------------

function constructEdgeGreedy(model: Model): number[][] {
  const { n, scoreAff, compat, conflictBit, habitatBit } = model;

  // Strongest few partners per vertex → a small, high-value edge list.
  interface Edge {
    a: number;
    b: number;
    w: number;
  }
  const edges: Edge[] = [];
  const seen = new Set<number>();
  const scratch: number[] = [];
  for (let i = 0; i < n; i++) {
    scratch.length = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      if (!compat[i * n + j]) continue;
      if (scoreAff[i * n + j] > 0) scratch.push(j);
    }
    scratch.sort((x, y) => scoreAff[i * n + y] - scoreAff[i * n + x]);
    const k = Math.min(NEIGHBOR_K, scratch.length);
    for (let t = 0; t < k; t++) {
      const j = scratch[t];
      const a = i < j ? i : j;
      const b = i < j ? j : i;
      const key = a * n + b;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b, w: scoreAff[key] });
    }
  }
  edges.sort((x, y) => y.w - x.w);

  const groupOf = new Int32Array(n);
  const members: number[][] = new Array(n);
  const gConf = new Int32Array(n);
  const gHab = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    groupOf[i] = i;
    members[i] = [i];
    gConf[i] = conflictBit[i];
    gHab[i] = habitatBit[i];
  }

  for (const e of edges) {
    const ga = groupOf[e.a];
    const gb = groupOf[e.b];
    if (ga === gb) continue;
    const ma = members[ga];
    const mb = members[gb];
    if (ma.length + mb.length > 4) continue;
    if ((gConf[ga] & gHab[gb]) !== 0 || (gConf[gb] & gHab[ga]) !== 0) continue;
    // Merge gb into ga.
    for (const v of mb) {
      ma.push(v);
      groupOf[v] = ga;
    }
    gConf[ga] |= gConf[gb];
    gHab[ga] |= gHab[gb];
    mb.length = 0;
  }

  const out: number[][] = [];
  for (let i = 0; i < n; i++) if (members[i].length > 0) out.push(members[i]);
  return out;
}

// ---------------------------------------------------------------------------
// Local search — relocate + swap to a local optimum.
// Relocate MAY empty its source group (absorbing singletons into richer groups),
// which the previous implementation could not do.
// ---------------------------------------------------------------------------

function localSearch(gs: number[][], model: Model, deadlineMs: number): void {
  const { n, scoreAff } = model;

  let changed = true;
  let guard = 0;
  while (changed && guard++ < 1000) {
    if (Date.now() >= deadlineMs) break;
    changed = false;

    for (let i = 0; i < gs.length; i++) {
      const gA = gs[i];
      if (gA.length === 0) continue;
      for (let j = i + 1; j < gs.length; j++) {
        const gB = gs[j];
        if (gB.length === 0) continue;

        // Swap one member of A with one member of B.
        for (let a = 0; a < gA.length; a++) {
          const left = gA[a];
          for (let b = 0; b < gB.length; b++) {
            const right = gB[b];
            let okA = true;
            for (let k = 0; k < gA.length; k++) {
              if (k === a) continue;
              if (!model.compat[right * n + gA[k]]) {
                okA = false;
                break;
              }
            }
            if (!okA) continue;
            let okB = true;
            for (let k = 0; k < gB.length; k++) {
              if (k === b) continue;
              if (!model.compat[left * n + gB[k]]) {
                okB = false;
                break;
              }
            }
            if (!okB) continue;
            let delta = 0;
            for (let k = 0; k < gA.length; k++)
              if (k !== a)
                delta +=
                  scoreAff[right * n + gA[k]] - scoreAff[left * n + gA[k]];
            for (let k = 0; k < gB.length; k++)
              if (k !== b)
                delta +=
                  scoreAff[left * n + gB[k]] - scoreAff[right * n + gB[k]];
            if (delta > 0) {
              gA[a] = right;
              gB[b] = left;
              changed = true;
            }
          }
        }

        // Relocate a member of A into B (may empty A).
        if (gB.length < 4) {
          for (let a = 0; a < gA.length; a++) {
            const c = gA[a];
            if (!canJoin(gB, c, model)) continue;
            let delta = 0;
            for (let k = 0; k < gB.length; k++) delta += scoreAff[c * n + gB[k]];
            for (let k = 0; k < gA.length; k++)
              if (k !== a) delta -= scoreAff[c * n + gA[k]];
            if (delta > 0) {
              gA.splice(a, 1);
              gB.push(c);
              changed = true;
              a--;
              if (gB.length >= 4 || gA.length === 0) break;
            }
          }
        }

        // Relocate a member of B into A (may empty B).
        if (gA.length > 0 && gA.length < 4) {
          for (let b = 0; b < gB.length; b++) {
            const c = gB[b];
            if (!canJoin(gA, c, model)) continue;
            let delta = 0;
            for (let k = 0; k < gA.length; k++) delta += scoreAff[c * n + gA[k]];
            for (let k = 0; k < gB.length; k++)
              if (k !== b) delta -= scoreAff[c * n + gB[k]];
            if (delta > 0) {
              gB.splice(b, 1);
              gA.push(c);
              changed = true;
              b--;
              if (gA.length >= 4 || gB.length === 0) break;
            }
          }
        }
      }
    }

    // Drop any groups emptied by relocation.
    for (let i = gs.length - 1; i >= 0; i--)
      if (gs[i].length === 0) gs.splice(i, 1);
  }
}

// ---------------------------------------------------------------------------
// Iterated local search — perturb (ruin & greedily recreate) then re-optimise.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Eject a handful of random members and greedily reinsert them (best marginal gain). */
function perturb(gs: number[][], model: Model, rng: () => number): void {
  const { n, scoreAff } = model;
  const total = gs.reduce((s, g) => s + g.length, 0);
  if (total <= 2) return;
  const kicks = Math.min(total - 1, 3 + Math.floor(rng() * 6));

  const ejected: number[] = [];
  for (let t = 0; t < kicks; t++) {
    let gi = Math.floor(rng() * gs.length);
    let tries = 0;
    while (gs[gi].length === 0 && tries++ < gs.length) gi = (gi + 1) % gs.length;
    const g = gs[gi];
    if (g.length === 0) continue;
    const vi = Math.floor(rng() * g.length);
    ejected.push(g[vi]);
    g.splice(vi, 1);
  }
  for (let i = gs.length - 1; i >= 0; i--)
    if (gs[i].length === 0) gs.splice(i, 1);

  for (const v of ejected) {
    let bestGain = 0;
    let bestGroup = -1;
    for (let gi = 0; gi < gs.length; gi++) {
      const g = gs[gi];
      if (g.length >= 4) continue;
      if (!canJoin(g, v, model)) continue;
      let gain = 0;
      for (let k = 0; k < g.length; k++) gain += scoreAff[v * n + g[k]];
      // Randomised tie-breaking keeps successive perturbations diverse.
      if (gain > bestGain || (gain === bestGain && rng() < 0.35)) {
        bestGain = gain;
        bestGroup = gi;
      }
    }
    if (bestGroup >= 0) gs[bestGroup].push(v);
    else gs.push([v]);
  }
}

function clone(gs: number[][]): number[][] {
  return gs.map((g) => g.slice());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface ComputeAutoGroupsOptions {
  /** Slight preference to place evolution-line relatives together when habitat-compatible. */
  preferEvolutionLines?: boolean;
}

/**
 * Partition Pokémon into groups of up to 4, maximising shared favorites while
 * respecting habitat conflicts.
 * Groups are ordered by {@link groupScore} descending (highest favorite overlap first).
 * Members within each group are ordered by {@link comparePokemonByDex}.
 */
export function computeAutoGroups(
  pokemon: Pokemon[],
  options: ComputeAutoGroupsOptions = {},
): Pokemon[][] {
  if (pokemon.length === 0) return [];

  const n = pokemon.length;
  const model = buildModel(pokemon, Boolean(options.preferEvolutionLines));
  const deadline = Date.now() + TIME_BUDGET_MS;

  let best = constructEdgeGreedy(model);
  localSearch(best, model, deadline);
  let bestScore = totalScore(best, model.scoreAff, n);
  // Secondary objective: among equal optimisation scores, prefer more raw favorite
  // overlap (only matters when the evolution bonus is active).
  let bestAff = totalScore(best, model.aff, n);

  // Iterated local search: keep perturbing the incumbent and re-optimising,
  // spending the remaining time budget to escape local optima. Stops early once
  // improvements dry up so small/easy inputs return quickly.
  const rng = mulberry32(0x9e3779b9 ^ n);
  let lastImprove = Date.now();
  for (;;) {
    const now = Date.now();
    if (now >= deadline || now - lastImprove >= STALL_MS) break;
    const trial = clone(best);
    perturb(trial, model, rng);
    localSearch(trial, model, deadline);
    const score = totalScore(trial, model.scoreAff, n);
    if (score < bestScore) continue;
    const aff = totalScore(trial, model.aff, n);
    if (score > bestScore || aff > bestAff) {
      bestScore = score;
      bestAff = aff;
      best = trial;
      lastImprove = now;
    }
  }

  // Present groups best-first using the same favorite-overlap score shown in the UI
  // (never the evolution bonus), tie-broken by lowest member dex for stable order.
  const groupAff = (g: number[]): number => {
    let s = 0;
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) s += model.aff[g[i] * n + g[j]];
    return s;
  };
  best.sort((ga, gb) => {
    const d = groupAff(gb) - groupAff(ga);
    if (d !== 0) return d;
    return Math.min(...ga) - Math.min(...gb);
  });

  return best.map((g) =>
    g.map((i) => pokemon[i]).sort(comparePokemonByDex),
  );
}

export interface SuggestedPokemon {
  pokemon: Pokemon;
  score: number;
}

/** Marginal favorite-overlap score if this Pokémon joins the group, and habitat legality. */
interface CandidateAddToGroupInfo {
  score: number;
  habitatCompatible: boolean;
}

function enumerateCandidateAddScores(
  group: Pokemon[],
  candidates: Pokemon[],
): { pokemon: Pokemon; score: number; habitatCompatible: boolean }[] {
  const all = [...group, ...candidates];
  const masks = buildFavMasks(all);
  const conflictBits = all.map(habitatConflictBit);
  const habitatBits = all.map(habitatBit);
  const gLen = group.length;
  const out: { pokemon: Pokemon; score: number; habitatCompatible: boolean }[] =
    [];

  for (let ci = 0; ci < candidates.length; ci++) {
    const pokemon = candidates[ci];
    const idx = gLen + ci;
    let habitatCompatible = true;
    for (let k = 0; k < gLen; k++) {
      if (
        conflictBits[k] & habitatBits[idx] ||
        conflictBits[idx] & habitatBits[k]
      ) {
        habitatCompatible = false;
        break;
      }
    }
    let score = 0;
    if (habitatCompatible)
      for (let k = 0; k < gLen; k++) score += sharedFav(masks, k, idx);
    out.push({ pokemon, score, habitatCompatible });
  }
  return out;
}

/**
 * Same scoring and habitat rules as {@link suggestNextPokemon}: `score` is the sum of shared
 * favorite counts with each current group member; incompatible candidates get `score` 0 and
 * `habitatCompatible` false.
 */
export function candidateAddInfoByPokemonId(
  group: Pokemon[],
  candidates: Pokemon[],
): Map<string, CandidateAddToGroupInfo> {
  const map = new Map<string, CandidateAddToGroupInfo>();
  if (group.length === 0) {
    for (const p of candidates)
      map.set(p.id, { score: 0, habitatCompatible: true });
    return map;
  }
  for (const row of enumerateCandidateAddScores(group, candidates)) {
    map.set(row.pokemon.id, {
      score: row.score,
      habitatCompatible: row.habitatCompatible,
    });
  }
  return map;
}

export function suggestNextPokemon(
  group: Pokemon[],
  candidates: Pokemon[],
  limit = 4,
): SuggestedPokemon[] {
  if (group.length === 0) return [];

  return enumerateCandidateAddScores(group, candidates)
    .filter((e) => e.habitatCompatible && e.score > 0)
    .sort((a, b) => {
      const d = b.score - a.score;
      if (d !== 0) return d;
      const dex = comparePokemonByDex(a.pokemon, b.pokemon);
      return dex !== 0 ? dex : a.pokemon.name.localeCompare(b.pokemon.name);
    })
    .slice(0, limit)
    .map(({ pokemon, score }) => ({ pokemon, score }));
}

/**
 * Favorite overlap for the whole group: for every **unordered pair** of Pokémon, add how many
 * favorite flavors they **share**, then sum. With 4 members there are 6 pairs—so if each pair
 * shared 5 identical favorites, the score would be 6 × 5 = **30** (not 5 × 4 = 20).
 */
export function groupScore(group: Pokemon[]): number {
  if (group.length === 0) return 0;
  const masks = buildFavMasks(group);
  const n = group.length;
  let score = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) score += sharedFav(masks, i, j);
  return score;
}

/**
 * Loose upper bound for {@link groupScore}: for each pair, the overlap cannot exceed
 * min(|favorites A|, |favorites B|). Summing that gives a ceiling users can compare against
 * (100% ≈ every pair overlaps as much as list sizes allow).
 */
export function groupScoreUpperBound(group: Pokemon[]): number {
  const n = group.length;
  let sum = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      sum += Math.min(group[i].favorites.length, group[j].favorites.length);
  return sum;
}
