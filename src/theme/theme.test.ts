import { describe, expect, it } from "vitest";
import { getHabitatColors, habitatIcons } from "../services/habitatColors";
import { createAppTheme } from "./theme";

describe("application theme", () => {
  it.each(["light", "dark"] as const)("creates the %s palette and habitat colors", (mode) => {
    const theme = createAppTheme(mode);
    const colors = getHabitatColors(theme);

    expect(theme.palette.mode).toBe(mode);
    expect(theme.palette.background.default).not.toBe(theme.palette.background.paper);
    expect(Object.keys(colors).sort()).toEqual([
      "Bright",
      "Cool",
      "Dark",
      "Dry",
      "Humid",
      "Warm",
    ]);
    for (const colorSet of Object.values(colors)) {
      expect(colorSet.bg).toMatch(/^#/);
      expect(colorSet.text).toMatch(/^#/);
      expect(colorSet.border).toMatch(/^#/);
    }
    expect(getHabitatColors(theme)).toBe(colors);
  });

  it("provides an icon for every habitat", () => {
    expect(Object.keys(habitatIcons).sort()).toEqual([
      "Bright",
      "Cool",
      "Dark",
      "Dry",
      "Humid",
      "Warm",
    ]);
  });
});
