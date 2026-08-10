// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../store/store";
import { LayoutSettingsMenu } from "./LayoutSettingsMenu";

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ nameLanguage: "en", themeMode: "system" });
});

describe("LayoutSettingsMenu", () => {
  it("changes the Pokemon language and closes the menu", async () => {
    const user = userEvent.setup();
    render(<LayoutSettingsMenu />);

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("menuitem", { name: /Pokémon Language/i }));
    await user.click(screen.getByRole("menuitem", { name: "Deutsch" }));

    expect(useStore.getState().nameLanguage).toBe("de");
    expect(screen.queryByRole("menuitem", { name: "Deutsch" })).not.toBeInTheDocument();
  });

  it("changes the explicit theme mode", async () => {
    const user = userEvent.setup();
    render(<LayoutSettingsMenu />);

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("menuitem", { name: /Theme/i }));
    await user.click(screen.getByRole("menuitem", { name: "Dark" }));

    expect(useStore.getState().themeMode).toBe("dark");
  });

  it("returns from a submenu without changing the current setting", async () => {
    const user = userEvent.setup();
    render(<LayoutSettingsMenu />);

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("menuitem", { name: /Pokémon Language/i }));
    await user.click(screen.getByRole("menuitem", { name: "Back" }));

    expect(useStore.getState().nameLanguage).toBe("en");
    expect(screen.getByRole("menuitem", { name: /Export \/ Import/i })).toBeInTheDocument();
  });
});
