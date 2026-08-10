import { describe, expect, it } from "vitest";
import type { Habitat, Pokemon } from "../types/types";
import { habitatConflictMap } from "./habitat-conflicts";
import { computeAutoGroups, groupScore } from "./matching.service";

function pokemon(
  id: string,
  dexNumber: number,
  idealHabitat: Habitat,
  favorites: string[],
): Pokemon {
  return {
    dexKind: "standard",
    id,
    dexNumber: String(dexNumber),
    name: id,
    specialties: [],
    idealHabitat,
    favorites,
    isHabitable: true,
  };
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
});
