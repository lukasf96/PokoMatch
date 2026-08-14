// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Pokemon } from "../../../types/types";
import GroupCard from "./GroupCard";

const testPokemon: Pokemon = {
  dexKind: "standard",
  id: "001",
  dexNumber: "001",
  name: "Bulbasaur",
  specialties: ["Gather"],
  idealHabitat: "Cool",
  favorites: ["Plants"],
};

describe("GroupCard actions", () => {
  it("places the share icon immediately before the primary delete action", async () => {
    const user = userEvent.setup();
    const share = vi.fn();
    const remove = vi.fn();

    render(
      <GroupCard
        group={[testPokemon]}
        groupNumber={1}
        habitat="Cool"
        groupActions={[{ ariaLabel: "Share group 1", onClick: share, kind: "share" }]}
        groupAction={{ ariaLabel: "Delete my group 1", onClick: remove, kind: "remove" }}
      />,
    );

    expect(screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Share group 1",
      "Delete my group 1",
    ]);
    await user.click(screen.getByRole("button", { name: "Share group 1" }));
    await user.click(screen.getByRole("button", { name: "Delete my group 1" }));
    expect(share).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });

  it("can hide the group label for a non-interactive image card", () => {
    render(
      <GroupCard
        group={[testPokemon]}
        groupNumber={1}
        habitat="Cool"
        showGroupName={false}
      />,
    );

    expect(screen.queryByText("Group 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
