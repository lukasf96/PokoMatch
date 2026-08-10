import { describe, expect, it } from "vitest";
import type { Habitat, Pokemon } from "../../types/types";
import {
  formatDexSegment,
  getDisplayHabitat,
  groupStableKey,
} from "./group-helpers";

function pokemon(id: string, idealHabitat: Habitat): Pokemon {
  return {
    dexKind: "standard",
    id,
    dexNumber: id,
    name: id,
    specialties: [],
    idealHabitat,
    favorites: [],
  };
}

describe("Match Maker group helpers", () => {
  it("formats numeric dex segments without changing special values", () => {
    expect(formatDexSegment("1")).toBe("001");
    expect(formatDexSegment(" 42 ")).toBe("042");
    expect(formatDexSegment("1234")).toBe("1234");
    expect(formatDexSegment(" E04 ")).toBe("E04");
  });

  it("builds order-sensitive stable keys", () => {
    expect(groupStableKey([{ id: "001" }, { id: "004" }])).toBe("001|004");
    expect(groupStableKey([])).toBe("");
  });

  it("uses the majority habitat and a stable order for ties and empty groups", () => {
    expect(getDisplayHabitat([])).toBe("Cool");
    expect(
      getDisplayHabitat([
        pokemon("one", "Warm"),
        pokemon("two", "Bright"),
        pokemon("three", "Warm"),
      ]),
    ).toBe("Warm");
    expect(
      getDisplayHabitat([
        pokemon("one", "Dark"),
        pokemon("two", "Cool"),
      ]),
    ).toBe("Cool");
  });
});
