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

    const { rehydrateStore, useStore } = await import("./store");
    await rehydrateStore();
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

  it("ignores no-op group reorders and suggestions", async () => {
    const { useStore } = await import("./store");
    useStore.getState().replaceCollectionData({
      unlockedIds: [],
      customGroups: [
        { id: "first", pokemonIds: ["001"], location: "Palette Town" },
        { id: "second", pokemonIds: ["004"] },
      ],
    });
    const before = useStore.getState().customGroups;

    useStore.getState().reorderCustomGroups("first", "first");
    useStore.getState().reorderCustomGroups("first", "missing");
    useStore.getState().reorderCustomGroups("missing", "first");
    useStore.getState().addSuggestedGroupToCustomGroups(["001", "004"]);

    expect(useStore.getState().customGroups).toBe(before);
    expect(before[0]).toEqual({
      id: "first",
      pokemonIds: ["001"],
      location: "Palette Town",
    });
  });

  it("stores display preferences", async () => {
    const { useStore } = await import("./store");

    useStore.getState().setNameLanguage("de");
    useStore.getState().setThemeMode("dark");
    useStore.getState().setPreferEvolutionLinesInMatching(true);
    useStore.getState().unlockAll();

    const state = useStore.getState();
    expect(state.nameLanguage).toBe("de");
    expect(state.themeMode).toBe("dark");
    expect(state.preferEvolutionLinesInMatching).toBe(true);
    expect(state.unlockedIds.size).toBeGreaterThan(0);
  });

  it("hydrates saved preferences and current-shape groups without rewriting", async () => {
    const saved = JSON.stringify({
      state: {
        nameLanguage: "fr",
        themeMode: "light",
        preferEvolutionLinesInMatching: true,
        customGroups: [{ id: "kept", pokemonIds: ["001"] }],
      },
      version: 0,
    });
    localStorage.setItem("pokomatch", saved);
    const setItem = vi.spyOn(localStorage, "setItem");

    const { rehydrateStore, useStore } = await import("./store");
    await rehydrateStore();
    const state = useStore.getState();

    expect(state.nameLanguage).toBe("fr");
    expect(state.themeMode).toBe("light");
    expect(state.preferEvolutionLinesInMatching).toBe(true);
    // Missing unlockedIds falls back to everything unlocked.
    expect(state.unlockedIds.size).toBeGreaterThan(1);
    expect(state.customGroups).toEqual([{ id: "kept", pokemonIds: ["001"] }]);
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([
    ["a null entry", [null]],
    ["an entry without an id", [{ pokemonIds: ["001"] }]],
  ])("rewrites stored groups containing %s", async (_label, customGroups) => {
    localStorage.setItem(
      "pokomatch",
      JSON.stringify({ state: { unlockedIds: [], customGroups }, version: 0 }),
    );
    const setItem = vi.spyOn(localStorage, "setItem");

    const { rehydrateStore } = await import("./store");
    await rehydrateStore();

    expect(setItem).toHaveBeenCalledWith("pokomatch", expect.any(String));
  });

  it("keeps defaults when nothing is saved", async () => {
    const { rehydrateStore, useStore } = await import("./store");
    await rehydrateStore();

    expect(useStore.getState().nameLanguage).toBe("en");
    expect(localStorage.getItem("pokomatch")).toBeNull();
  });

  it("debounces writes and serializes the unlocked Set as an array", async () => {
    const { useStore } = await import("./store");

    useStore.getState().lockAll();
    useStore.getState().unlockMany(["001"]);
    expect(localStorage.getItem("pokomatch")).toBeNull();

    vi.advanceTimersByTime(320);
    const stored = JSON.parse(localStorage.getItem("pokomatch") ?? "null") as {
      state: { unlockedIds: string[] };
    };
    expect(stored.state.unlockedIds).toEqual(["001"]);
  });

  it("flushes pending writes when the page is hidden or unloaded", async () => {
    const { useStore } = await import("./store");
    let hidden = false;
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() =>
      hidden ? "hidden" : "visible",
    );

    useStore.getState().setThemeMode("dark");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(localStorage.getItem("pokomatch")).toBeNull();

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(localStorage.getItem("pokomatch")).toContain('"themeMode":"dark"');

    useStore.getState().setThemeMode("light");
    window.dispatchEvent(new Event("beforeunload"));
    expect(localStorage.getItem("pokomatch")).toContain('"themeMode":"light"');

    // Nothing pending: flushing again leaves storage untouched.
    window.dispatchEvent(new Event("beforeunload"));
    expect(localStorage.getItem("pokomatch")).toContain('"themeMode":"light"');
  });

  it("removes the saved collection when persistence is cleared", async () => {
    localStorage.setItem("pokomatch", "{}");
    const { useStore } = await import("./store");

    await useStore.persist.clearStorage();

    expect(localStorage.getItem("pokomatch")).toBeNull();
  });
});
