import { describe, expect, it } from "vitest";
import type { Item, Pokemon } from "../types/types";
import { suggestItemsForGroup } from "./items";

function pokemon(id: string, favorites: string[]): Pokemon {
  return {
    dexKind: "standard",
    id,
    dexNumber: id,
    name: id,
    specialties: [],
    idealHabitat: "Bright",
    favorites,
  };
}

function item(id: string, name: string, favoriteCategories: string[]): Item {
  return { id, name, category: "Test", tag: "", favoriteCategories };
}

describe("suggestItemsForGroup", () => {
  it("scores coverage and overlap, filters noise, and sorts deterministically", () => {
    const group = [
      pokemon("one", ["A", "B"]),
      pokemon("two", ["A", "C", "Rare"]),
    ];
    const items = [
      item("zero", "Zero", ["Unrelated"]),
      item("covered-single", "Covered single", ["A"]),
      item("rare", "Rare only", ["Rare"]),
      item("z-pair", "Zulu pair", ["A", "B"]),
      item("a-pair", "Alpha pair", ["A", "C"]),
      item("both-pair", "Both pair", ["B", "C"]),
    ];

    expect(suggestItemsForGroup(group, items)).toEqual([
      { item: items[4], score: 2, pokemonCoverage: 2 },
      { item: items[5], score: 2, pokemonCoverage: 2 },
      { item: items[3], score: 2, pokemonCoverage: 2 },
      { item: items[2], score: 1, pokemonCoverage: 1 },
    ]);
  });

  it("matches favorite categories case-insensitively", () => {
    const group = [pokemon("horsea", ["Lots of Water"])];
    const items = [
      item("fountain", "Fountain", ["Lots of water"]),
      item("unrelated", "Unrelated", ["Lots of fire"]),
    ];

    expect(suggestItemsForGroup(group, items)).toEqual([
      { item: items[0], score: 1, pokemonCoverage: 1 },
    ]);
  });

  it("returns no suggestions without Pokemon, items, or group favorites", () => {
    const populatedItem = item("one", "One", ["A"]);
    expect(suggestItemsForGroup([], [populatedItem])).toEqual([]);
    expect(suggestItemsForGroup([pokemon("one", ["A"])], [])).toEqual([]);
    expect(suggestItemsForGroup([pokemon("one", [])], [populatedItem])).toEqual([]);
  });
});
