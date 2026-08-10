// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal("localStorage", createMemoryStorage());
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("persisted store", () => {
  it("hydrates and permanently rewrites the legacy custom-group shape", async () => {
    localStorage.setItem(
      "pokomatch",
      JSON.stringify({
        state: {
          unlockedIds: ["001", "004"],
          customGroups: [["001", "004"]],
        },
        version: 0,
      }),
    );

    const { useStore } = await import("./store");
    const state = useStore.getState();

    expect(state.unlockedIds).toEqual(new Set(["001", "004"]));
    expect(state.customGroups).toHaveLength(1);
    expect(state.customGroups[0]?.pokemonIds).toEqual(["001", "004"]);
    expect(state.customGroups[0]?.id).toEqual(expect.any(String));
    expect(state.nameLanguage).toBe("en");
    expect(state.themeMode).toBe("system");
    expect(state.preferEvolutionLinesInMatching).toBe(false);

    const rewritten = JSON.parse(localStorage.getItem("pokomatch") ?? "null") as {
      state: { customGroups: Array<{ id: string; pokemonIds: string[] }> };
    };
    expect(rewritten.state.customGroups).toEqual([
      {
        id: state.customGroups[0]?.id,
        pokemonIds: ["001", "004"],
      },
    ]);
  });

  it("updates the unlocked collection without mutating Set instances", async () => {
    const { useStore } = await import("./store");

    useStore.getState().lockAll();
    const emptySet = useStore.getState().unlockedIds;
    useStore.getState().unlockMany(["001", "004"]);
    const unlockedSet = useStore.getState().unlockedIds;
    useStore.getState().togglePokemon("001");
    useStore.getState().lockMany(["004"]);

    expect(emptySet).toEqual(new Set());
    expect(unlockedSet).toEqual(new Set(["001", "004"]));
    expect(unlockedSet).not.toBe(emptySet);
    expect(useStore.getState().unlockedIds).toEqual(new Set());
  });

  it("enforces custom-group uniqueness and capacity across group actions", async () => {
    const { useStore } = await import("./store");
    useStore.getState().replaceCollectionData({
      unlockedIds: [],
      customGroups: [],
    });

    useStore.getState().addCustomGroup();
    useStore.getState().addPokemonToCustomGroup(0, "001");
    useStore.getState().addPokemonToCustomGroup(0, "002");
    useStore.getState().addPokemonToCustomGroup(0, "003");
    useStore.getState().addPokemonToCustomGroup(0, "004");
    useStore.getState().addPokemonToCustomGroup(0, "005");
    useStore.getState().addCustomGroup();
    useStore.getState().addPokemonToCustomGroup(1, "001");

    expect(useStore.getState().customGroups.map(({ pokemonIds }) => pokemonIds)).toEqual([
      ["001", "002", "003", "004"],
      [],
    ]);

    useStore.getState().addSuggestedGroupToCustomGroups([
      "001",
      "005",
      "006",
      "007",
      "008",
      "009",
    ]);
    expect(useStore.getState().customGroups[2]?.pokemonIds).toEqual([
      "005",
      "006",
      "007",
      "008",
    ]);
  });

  it("reorders, edits, and deletes custom groups while preserving caller data", async () => {
    const { useStore } = await import("./store");
    const importedGroups = [
      { id: "first", pokemonIds: ["001"] },
      { id: "second", pokemonIds: ["004"] },
    ];
    useStore.getState().replaceCollectionData({
      unlockedIds: ["001", "004"],
      customGroups: importedGroups,
    });

    importedGroups[0]?.pokemonIds.push("external-mutation");
    useStore.getState().reorderCustomGroups("second", "first");
    useStore.getState().setCustomGroupLocation(0, "Palette Town");
    useStore.getState().removePokemonFromCustomGroup(1, "001");

    expect(useStore.getState().customGroups).toEqual([
      {
        id: "second",
        pokemonIds: ["004"],
        location: "Palette Town",
      },
      { id: "first", pokemonIds: [] },
    ]);

    useStore.getState().setCustomGroupLocation(0, undefined);
    useStore.getState().deleteCustomGroup(1);
    expect(useStore.getState().customGroups).toEqual([
      { id: "second", pokemonIds: ["004"] },
    ]);
  });
});
