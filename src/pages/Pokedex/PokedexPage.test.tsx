// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "../../store/store";
import PokedexPage from "./PokedexPage";

vi.mock("../../components/ScrollToTopFab", () => ({ ScrollToTopFab: () => null }));

describe("PokedexPage bulk actions", () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ unlockedIds: new Set(["a", "b"]) });
  });

  it("offers Undo after Lock all and restores the previous roster", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PokedexPage />
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole("button", { name: "Lock all" })[0]);
    expect(useStore.getState().unlockedIds.size).toBe(0);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("All Pokémon locked");
    await user.click(within(alert).getByRole("button", { name: "Undo" }));
    expect(useStore.getState().unlockedIds).toEqual(new Set(["a", "b"]));
  });

  it("labels habitat filters for assistive tech", () => {
    render(
      <MemoryRouter>
        <PokedexPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Humid" })).toBeInTheDocument();
  });
});
