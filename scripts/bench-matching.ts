/**
 * Benchmark + verification harness for the auto-grouping matcher.
 *
 *   pnpm tsx scripts/bench-matching.ts
 *
 * Loads the real dex (src/assets/pokedex.json), then for both the BASELINE snapshot
 * (scripts/baseline-matching.ts) and the CURRENT src/services/matching.service.ts:
 *   1. Validates output invariants (partition, size<=4, no habitat conflict, sort orders).
 *   2. Measures QUALITY = total shared-favorite objective across all groups.
 *   3. Measures SPEED  = wall-clock runtime (best of a few runs).
 *   4. Compares NEW vs OLD, and vs a brute-force optimum on tiny instances.
 */
import { readFile } from "node:fs/promises";
import { computeAutoGroupsBaseline } from "./baseline-matching";
import { resolveAppAssetPath } from "./utility/script-utils";
import { habitatConflictMap } from "../src/services/habitat-conflicts";
import { comparePokemonByDex } from "../src/services/pokemon";
import { computeAutoGroups } from "../src/services/matching.service";
import type { Pokemon } from "../src/types/types";

type Matcher = (
  pokemon: Pokemon[],
  options?: { preferEvolutionLines?: boolean },
) => Pokemon[][];

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

interface PokedexFile {
  standard: Omit<Pokemon, "dexKind">[];
  event: Omit<Pokemon, "dexKind">[];
  basin: Omit<Pokemon, "dexKind">[];
}

async function loadAllPokemon(): Promise<Pokemon[]> {
  const raw = await readFile(resolveAppAssetPath("pokedex.json"), "utf8");
  const data = JSON.parse(raw) as PokedexFile;
  return [
    ...data.standard.map((p) => ({ ...p, dexKind: "standard" as const })),
    ...data.event.map((p) => ({ ...p, dexKind: "event" as const })),
    ...data.basin.map((p) => ({ ...p, dexKind: "basin" as const })),
  ];
}

// ---------------------------------------------------------------------------
// Ground-truth scoring (independent of the implementations under test)
// ---------------------------------------------------------------------------

function sharedFavorites(a: Pokemon, b: Pokemon): number {
  const set = new Set(a.favorites);
  let n = 0;
  for (const f of b.favorites) if (set.has(f)) n++;
  return n;
}

/** Objective = sum over groups of sum over unordered pairs of shared-favorite counts. */
function objective(groups: Pokemon[][]): number {
  let total = 0;
  for (const g of groups)
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++)
        total += sharedFavorites(g[i], g[j]);
  return total;
}

function groupFavScore(g: Pokemon[]): number {
  let s = 0;
  for (let i = 0; i < g.length; i++)
    for (let j = i + 1; j < g.length; j++) s += sharedFavorites(g[i], g[j]);
  return s;
}

/** Count unordered pairs (within a group) that belong to the same evolution line. */
function evolutionPairs(groups: Pokemon[][]): number {
  let n = 0;
  for (const g of groups) {
    const sets = g.map((p) => new Set(p.evolutionLinePeerIds ?? []));
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++)
        if (sets[i].has(g[j].id)) n++;
  }
  return n;
}

const EVOLUTION_LINE_PAIR_BONUS = 2;

/** The objective the algorithm actually maximises when preferEvolutionLines is on. */
function evoAdjustedObjective(groups: Pokemon[][]): number {
  return objective(groups) + EVOLUTION_LINE_PAIR_BONUS * evolutionPairs(groups);
}

// ---------------------------------------------------------------------------
// Invariant validation
// ---------------------------------------------------------------------------

function habitatsConflict(a: Pokemon, b: Pokemon): boolean {
  return habitatConflictMap[a.idealHabitat] === b.idealHabitat;
}

function validateInvariants(input: Pokemon[], groups: Pokemon[][]): string[] {
  const errors: string[] = [];

  // Partition: each input appears exactly once.
  const seen = new Map<string, number>();
  for (const g of groups)
    for (const p of g) seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
  for (const p of input) {
    const c = seen.get(p.id) ?? 0;
    if (c !== 1) errors.push(`pokemon ${p.id} appears ${c} times (expected 1)`);
  }
  let placed = 0;
  for (const g of groups) placed += g.length;
  if (placed !== input.length)
    errors.push(`placed ${placed} pokemon but input had ${input.length}`);
  const inputIds = new Set(input.map((p) => p.id));
  for (const id of seen.keys())
    if (!inputIds.has(id)) errors.push(`output contains foreign id ${id}`);

  // Size cap.
  for (const g of groups)
    if (g.length > 4 || g.length < 1)
      errors.push(`group of illegal size ${g.length}`);

  // No opposite-habitat conflict inside any group.
  for (const g of groups)
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++)
        if (habitatsConflict(g[i], g[j]))
          errors.push(
            `habitat conflict in group: ${g[i].id}(${g[i].idealHabitat}) vs ${g[j].id}(${g[j].idealHabitat})`,
          );

  // Groups sorted by favorite-overlap score descending.
  for (let i = 1; i < groups.length; i++)
    if (groupFavScore(groups[i - 1]) < groupFavScore(groups[i]))
      errors.push(
        `groups not sorted by score desc at index ${i} (${groupFavScore(
          groups[i - 1],
        )} < ${groupFavScore(groups[i])})`,
      );

  // Members sorted by dex within each group.
  for (const g of groups)
    for (let i = 1; i < g.length; i++)
      if (comparePokemonByDex(g[i - 1], g[i]) > 0)
        errors.push(`members not dex-sorted: ${g[i - 1].id} before ${g[i].id}`);

  return errors;
}

// ---------------------------------------------------------------------------
// Deterministic subset sampling
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleSubset(all: Pokemon[], size: number, seed: number): Pokemon[] {
  if (size >= all.length) return all.slice();
  const rng = mulberry32(seed);
  const idx = all.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx
    .slice(0, size)
    .sort((a, b) => a - b)
    .map((i) => all[i]);
}

// ---------------------------------------------------------------------------
// Brute-force optimum (subset DP) for tiny instances
// ---------------------------------------------------------------------------

function bruteForceOptimum(input: Pokemon[]): number {
  const n = input.length;
  if (n > 14) throw new Error("brute force only for n<=14");
  const full = (1 << n) - 1;

  // Precompute per-subset validity (size 1..4, no conflict) and weight.
  const weight = new Int32Array(1 << n).fill(-1);
  const isValidGroup = (mask: number): boolean => {
    const bits: number[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) bits.push(i);
    if (bits.length < 1 || bits.length > 4) return false;
    for (let i = 0; i < bits.length; i++)
      for (let j = i + 1; j < bits.length; j++)
        if (habitatsConflict(input[bits[i]], input[bits[j]])) return false;
    return true;
  };
  const groupWeight = (mask: number): number => {
    const bits: number[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) bits.push(i);
    let w = 0;
    for (let i = 0; i < bits.length; i++)
      for (let j = i + 1; j < bits.length; j++)
        w += sharedFavorites(input[bits[i]], input[bits[j]]);
    return w;
  };

  const best = new Int32Array(1 << n).fill(-1);
  best[0] = 0;
  const solve = (S: number): number => {
    if (best[S] >= 0) return best[S];
    const low = S & -S; // lowest set bit — must be covered by the first group
    let bestVal = -1;
    // enumerate submasks T of S that contain `low`
    for (let T = S; T > 0; T = (T - 1) & S) {
      if (!(T & low)) continue;
      if (weight[T] === -1) weight[T] = isValidGroup(T) ? groupWeight(T) : -2;
      if (weight[T] < 0) continue;
      const rest = solve(S ^ T);
      if (rest < 0) continue;
      const val = weight[T] + rest;
      if (val > bestVal) bestVal = val;
    }
    best[S] = bestVal;
    return bestVal;
  };
  return solve(full);
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function timeCall(fn: () => void, runs: number): number {
  let best = Infinity;
  for (let r = 0; r < runs; r++) {
    const t0 = performance.now();
    fn();
    const dt = performance.now() - t0;
    if (dt < best) best = dt;
  }
  return best;
}

interface Row {
  size: number;
  prefEvo: boolean;
  baseObj: number;
  newObj: number;
  baseMs: number;
  newMs: number;
  errors: number;
  opt?: number;
}

function pad(s: string | number, w: number): string {
  return String(s).padStart(w);
}

async function main(): Promise<void> {
  const all = await loadAllPokemon();
  console.log(`Loaded ${all.length} pokemon.`);

  // Warm up the baseline's global favorite-vocab cache on the FULL set so its
  // internal scoring is correct for subsets too (fair comparison).
  computeAutoGroupsBaseline(all, { preferEvolutionLines: false });

  const sizes = [20, 50, 100, 200, all.length];
  const prefs = [false, true];
  const TIMING_RUNS = 3;

  const runOne = (
    label: string,
    matcher: Matcher,
    subset: Pokemon[],
    prefEvo: boolean,
  ): { obj: number; ms: number; errors: string[] } => {
    const groups = matcher(subset, { preferEvolutionLines: prefEvo });
    const errors = validateInvariants(subset, groups);
    const obj = objective(groups);
    const ms = timeCall(
      () => matcher(subset, { preferEvolutionLines: prefEvo }),
      TIMING_RUNS,
    );
    if (errors.length)
      console.log(
        `  ! ${label} invariant errors (${errors.length}): ${errors
          .slice(0, 3)
          .join("; ")}`,
      );
    return { obj, ms, errors };
  };

  const rows: Row[] = [];
  let totalErrors = 0;

  for (const prefEvo of prefs) {
    for (const size of sizes) {
      const subset = sampleSubset(all, size, 1000 + size);
      const base = runOne("baseline", computeAutoGroupsBaseline, subset, prefEvo);
      const neu = runOne("new", computeAutoGroups, subset, prefEvo);
      totalErrors += base.errors.length + neu.errors.length;
      rows.push({
        size: subset.length,
        prefEvo,
        baseObj: base.obj,
        newObj: neu.obj,
        baseMs: base.ms,
        newMs: neu.ms,
        errors: base.errors.length + neu.errors.length,
      });
    }
  }

  // Print comparison table.
  console.log("\n=== QUALITY & SPEED: baseline (OLD) vs new (NEW) ===");
  console.log(
    [
      pad("size", 5),
      pad("prefEvo", 8),
      pad("OLD obj", 9),
      pad("NEW obj", 9),
      pad("Δobj", 7),
      pad("Δ%", 7),
      pad("OLD ms", 8),
      pad("NEW ms", 8),
      pad("errs", 5),
    ].join(" "),
  );
  for (const r of rows) {
    const d = r.newObj - r.baseObj;
    const pct = r.baseObj > 0 ? (100 * d) / r.baseObj : 0;
    console.log(
      [
        pad(r.size, 5),
        pad(String(r.prefEvo), 8),
        pad(r.baseObj, 9),
        pad(r.newObj, 9),
        pad((d >= 0 ? "+" : "") + d, 7),
        pad((pct >= 0 ? "+" : "") + pct.toFixed(1), 7),
        pad(r.baseMs.toFixed(1), 8),
        pad(r.newMs.toFixed(1), 8),
        pad(r.errors, 5),
      ].join(" "),
    );
  }

  // With evolution preference on, the TRUE objective the matcher optimises is
  // favorites + 2*(evolution pairs). Show NEW dominates on that objective (a small
  // dip in raw-favorite score is the intended trade for grouping evolution lines).
  console.log(
    "\n=== EVOLUTION PREFERENCE (prefEvo=true): true objective = favorites + 2*evoPairs ===",
  );
  console.log(
    [
      pad("size", 5),
      pad("OLD fav", 8),
      pad("NEW fav", 8),
      pad("OLD evoP", 9),
      pad("NEW evoP", 9),
      pad("OLD true", 9),
      pad("NEW true", 9),
      pad("Δtrue", 7),
    ].join(" "),
  );
  for (const size of sizes) {
    const subset = sampleSubset(all, size, 1000 + size);
    const og = computeAutoGroupsBaseline(subset, { preferEvolutionLines: true });
    const ng = computeAutoGroups(subset, { preferEvolutionLines: true });
    const ot = evoAdjustedObjective(og);
    const nt = evoAdjustedObjective(ng);
    console.log(
      [
        pad(subset.length, 5),
        pad(objective(og), 8),
        pad(objective(ng), 8),
        pad(evolutionPairs(og), 9),
        pad(evolutionPairs(ng), 9),
        pad(ot, 9),
        pad(nt, 9),
        pad((nt - ot >= 0 ? "+" : "") + (nt - ot), 7),
      ].join(" "),
    );
  }

  // Brute-force optimality gap on tiny instances (no evo bonus).
  console.log("\n=== OPTIMALITY GAP on tiny instances (prefEvo=false) ===");
  console.log(
    [pad("n", 4), pad("OPT", 6), pad("OLD", 6), pad("NEW", 6), pad("NEW=OPT?", 9)].join(
      " ",
    ),
  );
  for (const n of [8, 10, 12]) {
    for (const seed of [1, 2, 3]) {
      const subset = sampleSubset(all, n, 7000 + n * 10 + seed);
      const opt = bruteForceOptimum(subset);
      const oldObj = objective(
        computeAutoGroupsBaseline(subset, { preferEvolutionLines: false }),
      );
      const newObj = objective(
        computeAutoGroups(subset, { preferEvolutionLines: false }),
      );
      console.log(
        [
          pad(n, 4),
          pad(opt, 6),
          pad(oldObj, 6),
          pad(newObj, 6),
          pad(newObj === opt ? "yes" : "NO", 9),
        ].join(" "),
      );
    }
  }

  console.log(
    `\nTotal invariant errors across all cases: ${totalErrors} ${
      totalErrors === 0 ? "(all invariants hold)" : "(SEE ABOVE)"
    }`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
