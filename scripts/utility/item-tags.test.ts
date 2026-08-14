import { describe, expect, it } from "vitest";
import { clearSingletonPhraseTags } from "./item-tags";

function item(id: string, tag: string) {
  return { id, name: id, tag, category: "Buildings", favoriteCategories: [] };
}

describe("clearSingletonPhraseTags", () => {
  it("clears a unique multi-word tag without listing the phrase", () => {
    const { items, dropped } = clearSingletonPhraseTags([
      item("arched-barrier", ""),
      item(
        "arched-barrier-leaf-pattern",
        "Variant when placing stnadard Arched berriers",
      ),
      item("handrail", "Road"),
      item("path", "Road"),
    ]);

    expect(items.find((i) => i.id === "arched-barrier-leaf-pattern")?.tag).toBe(
      "",
    );
    expect(items.find((i) => i.id === "handrail")?.tag).toBe("Road");
    expect(dropped).toEqual([
      {
        id: "arched-barrier-leaf-pattern",
        name: "arched-barrier-leaf-pattern",
        tag: "Variant when placing stnadard Arched berriers",
      },
    ]);
  });

  it("keeps unique short labels so a new one-off tag is not discarded", () => {
    const { items, dropped } = clearSingletonPhraseTags([
      item("bench", "Furniture"),
      item("lamp", "Decoration"),
      item("rug", "Decoration"),
    ]);
    expect(items.find((i) => i.id === "bench")?.tag).toBe("Furniture");
    expect(dropped).toEqual([]);
  });

  it("keeps unique two-word labels and shared long phrases", () => {
    const shared = "Lost Relic Variant Extra";
    const { items, dropped } = clearSingletonPhraseTags([
      item("relic-a", shared),
      item("relic-b", shared),
      item("panel", "Leaf Pattern"),
    ]);
    expect(items.map((i) => i.tag)).toEqual([shared, shared, "Leaf Pattern"]);
    expect(dropped).toEqual([]);
  });
});
