import { describe, expect, it } from "vitest";
import {
  decodeTransferString,
  encodeTransferData,
  type TransferData,
} from "./data-transfer";

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
});
