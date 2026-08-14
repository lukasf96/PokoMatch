import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stringifyPrettyJson } from "./pretty-json";

describe("stringifyPrettyJson", () => {
  it("expands objects and keeps empty containers compact", () => {
    expect(stringifyPrettyJson({ a: 1 })).toBe(`{\n  "a": 1\n}\n`);
    expect(stringifyPrettyJson({})).toBe("{}\n");
    expect(stringifyPrettyJson([])).toBe("[]\n");
  });

  it("inlines short primitive arrays and expands ones that exceed printWidth", () => {
    const compact = stringifyPrettyJson({ specialties: ["Grow"] });
    expect(compact).toContain('"specialties": ["Grow"]');
    expect(compact).not.toContain("[\n");

    const wide = stringifyPrettyJson({
      evolutionLinePeerIds: [
        "281",
        "282",
        "283",
        "284",
        "285",
        "286",
        "287",
        "288",
      ],
    });
    expect(wide).toContain('"evolutionLinePeerIds": [');
    expect(wide).toContain('\n    "281",\n');
  });

  it("omits undefined object keys and preserves insertion order", () => {
    const text = stringifyPrettyJson({
      name: "Tangrowth",
      isHabitable: undefined,
      localizedNames: { de: "Tangoloss" },
    });
    expect(text).not.toContain("isHabitable");
    expect(text.indexOf('"name"')).toBeLessThan(text.indexOf('"localizedNames"'));
  });

  it("round-trips the committed Pokédex layout so collectors match format-on-save", async () => {
    const pokedexPath = path.join(
      process.cwd(),
      "src",
      "assets",
      "pokedex.json",
    );
    const committed = await readFile(pokedexPath, "utf8");
    const parsed: unknown = JSON.parse(committed);
    expect(stringifyPrettyJson(parsed)).toBe(committed);
  });

  it("round-trips the committed items layout so collectors match format-on-save", async () => {
    const itemsPath = path.join(process.cwd(), "src", "assets", "items.json");
    const committed = await readFile(itemsPath, "utf8");
    const parsed: unknown = JSON.parse(committed);
    expect(stringifyPrettyJson(parsed)).toBe(committed);
  });
});
