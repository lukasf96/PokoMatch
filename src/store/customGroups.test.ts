import { describe, expect, it } from "vitest";
import {
  createCustomGroup,
  isPokopiaLocation,
  normalizeCustomGroups,
} from "./customGroups";

describe("custom-group helpers", () => {
  it("recognizes only supported Pokopia locations", () => {
    expect(isPokopiaLocation("Palette Town")).toBe(true);
    expect(isPokopiaLocation("Bubbly Basin")).toBe(true);
    expect(isPokopiaLocation("Cloud Island")).toBe(false);
    expect(isPokopiaLocation(undefined)).toBe(false);
  });

  it("creates groups with IDs and optional locations", () => {
    expect(createCustomGroup(["001"], "Bleak Beach")).toMatchObject({
      id: expect.any(String),
      pokemonIds: ["001"],
      location: "Bleak Beach",
    });
    expect(createCustomGroup()).toEqual({
      id: expect.any(String),
      pokemonIds: [],
    });
  });

  it("normalizes legacy and current shapes while preserving valid order", () => {
    const result = normalizeCustomGroups([
      ["001", 2, "004"],
      {
        id: "kept-id",
        pokemonIds: ["007", null, "008"],
        location: "Bubbly Basin",
      },
      {
        id: "",
        pokemonIds: "not-an-array",
        location: "Cloud Island",
      },
      null,
      42,
    ]);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: expect.any(String),
      pokemonIds: ["001", "004"],
    });
    expect(result[1]).toEqual({
      id: "kept-id",
      pokemonIds: ["007", "008"],
      location: "Bubbly Basin",
    });
    expect(result[2]).toEqual({
      id: expect.any(String),
      pokemonIds: [],
    });
  });

  it("returns an empty list for non-array persisted values", () => {
    expect(normalizeCustomGroups(undefined)).toEqual([]);
    expect(normalizeCustomGroups({ pokemonIds: ["001"] })).toEqual([]);
  });
});
