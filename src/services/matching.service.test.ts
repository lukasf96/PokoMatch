import { describe, expect, it } from "vitest";
import type { Habitat, Pokemon } from "../types/types";
import { habitatConflictMap } from "./habitat-conflicts";
import { habitablePokemon } from "./pokemon";
import {
  candidateAddInfoByPokemonId,
  computeAutoGroups,
  groupScore,
  groupScoreUpperBound,
  suggestNextPokemon,
} from "./matching.service";

function pokemon(
  id: string,
  dexNumber: number,
  idealHabitat: Habitat,
  favorites: string[],
  evolutionLinePeerIds?: string[],
): Pokemon {
  return {
    dexKind: "standard",
    id,
    dexNumber: String(dexNumber),
    name: id,
    specialties: [],
    idealHabitat,
    favorites,
    evolutionLinePeerIds,
    isHabitable: true,
  };
}

function groupIds(groups: Pokemon[][]): string[][] {
  return groups.map((group) => group.map(({ id }) => id));
}

describe("computeAutoGroups", () => {
  it("partitions every Pokemon exactly once into legal, score-ordered groups", () => {
    const input = [
      pokemon("bulbasaur", 1, "Humid", ["Plants", "Nature"]),
      pokemon("ivysaur", 2, "Humid", ["Plants", "Nature"]),
      pokemon("charmander", 4, "Warm", ["Fire", "Outdoors"]),
      pokemon("charmeleon", 5, "Warm", ["Fire", "Outdoors"]),
      pokemon("squirtle", 7, "Cool", ["Water", "Nature"]),
      pokemon("wartortle", 8, "Cool", ["Water", "Nature"]),
      pokemon("sandshrew", 27, "Dry", ["Sand", "Outdoors"]),
      pokemon("sandslash", 28, "Dry", ["Sand", "Outdoors"]),
      pokemon("oddish", 43, "Dark", ["Plants", "Nature"]),
    ];

    const groups = computeAutoGroups(input);
    const flattened = groups.flat();

    expect(flattened).toHaveLength(input.length);
    expect(new Set(flattened.map(({ id }) => id))).toEqual(
      new Set(input.map(({ id }) => id)),
    );

    for (const group of groups) {
      expect(group.length).toBeGreaterThanOrEqual(1);
      expect(group.length).toBeLessThanOrEqual(4);
      expect(group.map(({ dexNumber }) => Number(dexNumber))).toEqual(
        [...group]
          .map(({ dexNumber }) => Number(dexNumber))
          .sort((a, b) => a - b),
      );

      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          expect(group[j].idealHabitat).not.toBe(
            habitatConflictMap[group[i].idealHabitat],
          );
        }
      }
    }

    const scores = groups.map(groupScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("handles empty, singleton, small compatible, and conflicting inputs", () => {
    const bright = pokemon("bright", 1, "Bright", ["Nature"]);
    const dark = pokemon("dark", 2, "Dark", ["Nature"]);
    const cool = pokemon("cool", 3, "Cool", ["Nature"]);

    expect(computeAutoGroups([])).toEqual([]);
    expect(computeAutoGroups([bright])).toEqual([[bright]]);
    expect(groupIds(computeAutoGroups([bright, cool]))).toEqual([
      ["bright", "cool"],
    ]);
    expect(groupIds(computeAutoGroups([bright, dark]))).toEqual([
      ["bright"],
      ["dark"],
    ]);
  });

  it("is deterministic for the same input and preference", () => {
    const input = Array.from({ length: 9 }, (_, index) =>
      pokemon(
        `pokemon-${index}`,
        index + 1,
        index % 2 === 0 ? "Bright" : "Humid",
        [`shared-${index % 3}`, `shared-${(index + 1) % 3}`],
      ),
    );

    const first = groupIds(computeAutoGroups(input));
    expect(groupIds(computeAutoGroups(input))).toEqual(first);
    expect(groupIds(computeAutoGroups(input))).toEqual(first);
  });

  it("uses the evolution-line bonus without sacrificing raw affinity", () => {
    const first = pokemon("first", 1, "Bright", ["first"], ["second"]);
    const second = pokemon("second", 2, "Bright", ["second"], ["first"]);
    const affinityPair = [
      pokemon("third", 3, "Bright", ["shared"]),
      pokemon("fourth", 4, "Bright", ["shared"]),
    ];
    const input = [first, second, ...affinityPair];

    const regular = computeAutoGroups(input);
    const preferred = computeAutoGroups(input, { preferEvolutionLines: true });
    const evolutionGroup = preferred.find((group) =>
      group.some(({ id }) => id === first.id),
    );

    expect(evolutionGroup?.map(({ id }) => id)).toContain(second.id);
    expect(preferred.reduce((sum, group) => sum + groupScore(group), 0)).toBeGreaterThanOrEqual(
      regular.reduce((sum, group) => sum + groupScore(group), 0),
    );
  });

  it("meets invariants and a quality floor on a representative real-dex subset", () => {
    const input = habitablePokemon.slice(0, 24);
    const groups = computeAutoGroups(input);
    const outputIds = groups.flatMap((group) => group.map(({ id }) => id));

    expect(outputIds).toHaveLength(input.length);
    expect(new Set(outputIds)).toEqual(new Set(input.map(({ id }) => id)));
    expect(groups.every((group) => group.length >= 1 && group.length <= 4)).toBe(true);
    for (const group of groups) {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          expect(group[j].idealHabitat).not.toBe(
            habitatConflictMap[group[i].idealHabitat],
          );
        }
      }
    }
    expect(groups.reduce((sum, group) => sum + groupScore(group), 0)).toBeGreaterThanOrEqual(45);
  });
});

describe("suggestNextPokemon", () => {
  const group = [
    pokemon("group-a", 1, "Bright", ["Nature", "Plants"]),
    pokemon("group-b", 2, "Humid", ["Nature", "Water"]),
  ];

  it("excludes habitat conflicts and ranks by total group affinity", () => {
    const candidates = [
      pokemon("dark-conflict", 3, "Dark", ["Nature", "Plants", "Water"]),
      pokemon("dry-conflict", 4, "Dry", ["Nature", "Plants", "Water"]),
      pokemon("medium", 8, "Warm", ["Nature"]),
      pokemon("best", 9, "Warm", ["Nature", "Plants", "Water"]),
      pokemon("no-affinity", 10, "Warm", ["Fire"]),
    ];

    expect(suggestNextPokemon(group, candidates)).toEqual([
      { pokemon: candidates[3], score: 4 },
      { pokemon: candidates[2], score: 2 },
    ]);

    const info = candidateAddInfoByPokemonId(group, candidates);
    expect(info.get("dark-conflict")).toEqual({
      score: 0,
      habitatCompatible: false,
    });
    expect(info.get("best")).toEqual({ score: 4, habitatCompatible: true });
    expect(info.get("no-affinity")).toEqual({
      score: 0,
      habitatCompatible: true,
    });
  });

  it("handles empty groups, result limits, and deterministic dex tie-breaking", () => {
    const laterDex = pokemon("later", 20, "Warm", ["Nature"]);
    const earlierDex = pokemon("earlier", 10, "Warm", ["Nature"]);

    expect(suggestNextPokemon([], [earlierDex])).toEqual([]);
    expect(suggestNextPokemon(group, [laterDex, earlierDex], 1)).toEqual([
      { pokemon: earlierDex, score: 2 },
    ]);
    expect(candidateAddInfoByPokemonId([], [laterDex])).toEqual(
      new Map([
        [laterDex.id, { score: 0, habitatCompatible: true }],
      ]),
    );
  });
});

describe("group scoring", () => {
  it("sums each unordered pair once and computes its upper bound", () => {
    const group = [
      pokemon("one", 1, "Bright", ["A", "B", "C"]),
      pokemon("two", 2, "Bright", ["A", "B"]),
      pokemon("three", 3, "Bright", ["A", "C"]),
    ];

    expect(groupScore([])).toBe(0);
    expect(groupScore([group[0]])).toBe(0);
    expect(groupScore(group)).toBe(5);
    expect(groupScoreUpperBound(group)).toBe(6);
  });

  it("deduplicates favorite tags and counts overlaps above the 32-bit boundary", () => {
    const fortyFavorites = Array.from({ length: 40 }, (_, index) => `tag-${index}`);
    const highBitFavorites = Array.from(
      { length: 5 },
      (_, index) => `tag-${index + 35}`,
    );
    const duplicateFavorites = ["duplicate", "duplicate"];

    expect(
      groupScore([
        pokemon("wide", 1, "Bright", fortyFavorites),
        pokemon("high-bits", 2, "Bright", highBitFavorites),
      ]),
    ).toBe(5);
    expect(
      groupScore([
        pokemon("duplicate-a", 3, "Bright", duplicateFavorites),
        pokemon("duplicate-b", 4, "Bright", ["duplicate"]),
      ]),
    ).toBe(1);
  });
});
