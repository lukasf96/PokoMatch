import { describe, expect, it } from "vitest";
import {
  decodeTransferString,
  encodeTransferData,
  sanitizeTransferData,
  type TransferData,
} from "./data-transfer";

function encodeRawPayload(value: unknown): string {
  const json = JSON.stringify(value);
  const encoded = btoa(
    String.fromCharCode(...new TextEncoder().encode(json)),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `PKM1.${encoded}`;
}

describe("collection transfer strings", () => {
  it("round-trips collection data exactly and rejects a corrupted payload", () => {
    const data: TransferData = {
      unlockedIds: ["001", "004", "007"],
      customGroups: [
        {
          id: "starter-group",
          pokemonIds: ["001", "004"],
          location: "Palette Town",
        },
        { id: "water-group", pokemonIds: ["007"] },
      ],
    };

    const encoded = encodeTransferData(data);

    expect(decodeTransferString(encoded)).toEqual({ ok: true, data });

    const finalCharacter = encoded.at(-1);
    const corrupted = `${encoded.slice(0, -1)}${finalCharacter === "A" ? "B" : "A"}`;
    const result = decodeTransferString(corrupted);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/corrupted|decode/i);
    }
  });

  it.each([
    ["empty input", "", /paste/i],
    ["unknown prefix", "not-a-transfer", /doesn.t look/i],
    ["unsupported version", "PKM2.payload", /unsupported transfer version/i],
    ["incomplete input", "PKM1.", /incomplete/i],
    ["invalid encoding", "PKM1.not-json", /decode/i],
    ["missing fields", encodeRawPayload({ v: 1 }), /missing required data/i],
    [
      "invalid shape",
      encodeRawPayload({ v: 1, u: "001", g: [], c: "checksum" }),
      /invalid data shape/i,
    ],
    [
      "missing checksum",
      encodeRawPayload({ v: 1, u: [], g: [], c: "" }),
      /checksum is missing/i,
    ],
  ])("rejects %s", (_caseName, input, expectedError) => {
    const result = decodeTransferString(input);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(expectedError);
  });
});

describe("sanitizeTransferData", () => {
  it("enforces known IDs, group uniqueness, capacity, valid locations, and order", () => {
    const unsafeData = {
      unlockedIds: ["001", "unknown", "001", "002"],
      customGroups: [
        {
          id: "first",
          pokemonIds: ["001", "001", "unknown", "002", "003", "004", "005"],
          location: "Palette Town",
        },
        {
          id: "first",
          pokemonIds: ["002", "005"],
          location: "Invalid Place",
        },
        { id: "empty", pokemonIds: ["unknown"] },
        { id: "third", pokemonIds: ["006"] },
      ],
    } as unknown as TransferData;

    const result = sanitizeTransferData(
      unsafeData,
      new Set(["001", "002", "003", "004", "005", "006"]),
    );

    expect(result.unlockedIds).toEqual(["001", "002"]);
    expect(result.customGroups).toHaveLength(3);
    expect(result.customGroups[0]).toEqual({
      id: "first",
      pokemonIds: ["001", "002", "003", "004"],
      location: "Palette Town",
    });
    expect(result.customGroups[1]?.pokemonIds).toEqual(["005"]);
    expect(result.customGroups[1]?.id).not.toBe("first");
    expect(result.customGroups[1]).not.toHaveProperty("location");
    expect(result.customGroups[2]).toEqual({
      id: "third",
      pokemonIds: ["006"],
    });
  });
});
