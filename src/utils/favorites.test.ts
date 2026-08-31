import { describe, expect, it } from "vitest";
import { favoriteKey, groupFavoriteKeys } from "./favorites";

describe("favoriteKey", () => {
  it("trims and lowercases so mixed capitalization still matches", () => {
    expect(favoriteKey("Lots of Water")).toBe(favoriteKey("Lots of water"));
    expect(favoriteKey(" Group Activities ")).toBe("group activities");
  });
});

describe("groupFavoriteKeys", () => {
  it("unions favorites by case-insensitive key", () => {
    expect(
      groupFavoriteKeys([
        { favorites: ["Lots of Water", "Play spaces"] },
        { favorites: ["Lots of water", "Ocean vibes"] },
      ]),
    ).toEqual(new Set(["lots of water", "play spaces", "ocean vibes"]));
  });
});
