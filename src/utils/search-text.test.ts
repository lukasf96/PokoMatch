import { describe, expect, it } from "vitest";
import {
  computeHighlightSegments,
  normalizedHaystackMatchesQuery,
  normalizeForSearch,
  searchTokensFromInput,
} from "./search-text";

describe("search normalization", () => {
  it("normalizes case and accents and matches every whitespace-separated token", () => {
    const haystack = normalizeForSearch("Flabébé in a Bright Garden");

    expect(haystack).toBe("flabebe in a bright garden");
    expect(normalizedHaystackMatchesQuery(haystack, " FLABÉ  garden ")).toBe(true);
    expect(normalizedHaystackMatchesQuery(haystack, "flabe dark")).toBe(false);
    expect(normalizedHaystackMatchesQuery(haystack, "   ")).toBe(true);
  });

  it("extracts non-empty query tokens", () => {
    expect(searchTokensFromInput("  bright   garden ")).toEqual([
      "bright",
      "garden",
    ]);
    expect(searchTokensFromInput(" \t ")).toEqual([]);
  });
});

describe("highlight segments", () => {
  it("highlights case-insensitive matches while preserving original text", () => {
    expect(computeHighlightSegments("Bright bright Garden", "BRIGHT garden")).toEqual([
      { highlight: true, text: "Bright" },
      { highlight: false, text: " " },
      { highlight: true, text: "bright" },
      { highlight: false, text: " " },
      { highlight: true, text: "Garden" },
    ]);
  });

  it("escapes regex punctuation and merges overlapping matches", () => {
    expect(computeHighlightSegments("A+B+C", "+ B+")).toEqual([
      { highlight: false, text: "A" },
      { highlight: true, text: "+B+" },
      { highlight: false, text: "C" },
    ]);
  });

  it("handles empty text, empty queries, and missing matches", () => {
    expect(computeHighlightSegments("Pikachu", "")).toEqual([
      { highlight: false, text: "Pikachu" },
    ]);
    expect(computeHighlightSegments("Pikachu", "Eevee")).toEqual([
      { highlight: false, text: "Pikachu" },
    ]);
    expect(computeHighlightSegments("", "Pika")).toEqual([]);
  });
});
