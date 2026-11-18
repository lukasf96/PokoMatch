// @vitest-environment node

import { describe, expect, it } from "vitest";

// The prerender build imports the store on the server, where no browser
// storage exists. Every persistence path must be a silent no-op there.
describe("store on the server", () => {
  it("keeps default state and never touches storage", async () => {
    expect(typeof window).toBe("undefined");
    const { rehydrateStore, useStore } = await import("./store");

    rehydrateStore();
    useStore.getState().setThemeMode("dark");
    await useStore.persist.rehydrate();
    await useStore.persist.clearStorage();

    const state = useStore.getState();
    expect(state.themeMode).toBe("dark");
    expect(state.nameLanguage).toBe("en");
    expect(state.unlockedIds.size).toBeGreaterThan(0);
  });
});
