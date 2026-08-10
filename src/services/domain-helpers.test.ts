import { describe, expect, it } from "vitest";
import type { Habitat, Pokemon } from "../types/types";
import {
  getGroupConflicts,
  getGroupHabitats,
  habitatConflictMap,
} from "./habitat-conflicts";
import { getPokemonDisplayName } from "./pokemon-localization";
import { getPokemonSpriteUrl } from "./pokemon-sprites";
import {
  allPokemon,
  basinPokemon,
  comparePokemonByDex,
  eventPokemon,
  habitablePokemon,
  isBasinDexPokemon,
  isEventDexPokemon,
  standardPokemon,
} from "./pokemon";

function pokemon(
  id: string,
  dexNumber: string,
  idealHabitat: Habitat = "Bright",
): Pokemon {
  return {
    dexKind: "standard",
    id,
    dexNumber,
    name: id,
    specialties: [],
    idealHabitat,
    favorites: [],
  };
}

describe("habitat helpers", () => {
  it("defines all opposite habitat pairs symmetrically", () => {
    for (const [habitat, opposite] of Object.entries(habitatConflictMap)) {
      expect(habitatConflictMap[opposite]).toBe(habitat);
    }
  });

  it("returns sorted unique habitats and each conflict only once", () => {
    const group = [
      pokemon("one", "1", "Warm"),
      pokemon("two", "2", "Cool"),
      pokemon("three", "3", "Bright"),
      pokemon("four", "4", "Dark"),
      pokemon("five", "5", "Warm"),
    ];

    expect(getGroupHabitats(group)).toEqual(["Bright", "Cool", "Dark", "Warm"]);
    expect(getGroupConflicts(group)).toEqual([
      ["Bright", "Dark"],
      ["Cool", "Warm"],
    ]);
    expect(getGroupConflicts([])).toEqual([]);
  });
});

describe("Pokemon catalog helpers", () => {
  it("assembles the typed catalogs and excludes explicitly uninhabitable entries", () => {
    expect(allPokemon).toEqual([
      ...standardPokemon,
      ...eventPokemon,
      ...basinPokemon,
    ]);
    expect(standardPokemon.every(({ dexKind }) => dexKind === "standard")).toBe(true);
    expect(eventPokemon.every(isEventDexPokemon)).toBe(true);
    expect(basinPokemon.every(isBasinDexPokemon)).toBe(true);
    expect(habitablePokemon.every(({ isHabitable }) => isHabitable !== false)).toBe(true);
  });

  it("sorts numeric and special dex values with stable ID tie-breaking", () => {
    const numeric = [pokemon("ten", "10"), pokemon("two", " 2 ")];
    expect(numeric.sort(comparePokemonByDex).map(({ id }) => id)).toEqual([
      "two",
      "ten",
    ]);

    const special = [
      pokemon("event-10", "E10"),
      pokemon("event-2", "E2"),
      pokemon("a", "E2"),
    ];
    expect(special.sort(comparePokemonByDex).map(({ id }) => id)).toEqual([
      "a",
      "event-2",
      "event-10",
    ]);
  });
});

describe("Pokemon presentation helpers", () => {
  const localized: Pokemon = {
    ...pokemon("Bulbasaur", "1"),
    name: "Bulbasaur",
    localizedNames: { de: "Bisasam", fr: "Bulbizarre" },
  };

  it("returns localized names with an English fallback", () => {
    expect(getPokemonDisplayName(localized, "en")).toBe("Bulbasaur");
    expect(getPokemonDisplayName(localized, "de")).toBe("Bisasam");
    expect(getPokemonDisplayName(localized, "fr")).toBe("Bulbizarre");
    expect(getPokemonDisplayName(pokemon("Fallback", "2"), "de")).toBe("Fallback");
  });

  it("builds local sprite URLs and rejects empty IDs", () => {
    expect(getPokemonSpriteUrl("001")).toBe("/sprites/pokemon/001.webp");
    expect(getPokemonSpriteUrl("b001")).toBe("/sprites/pokemon/b001.webp");
    expect(getPokemonSpriteUrl("")).toBeNull();
  });
});
