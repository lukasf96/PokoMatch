// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Pokemon } from "../../../types/types";
import { SharedGroupPreview } from "./SharedGroupPreview";

vi.mock("./GroupCard", () => ({
  default: () => <div data-testid="shared-group-card" />,
}));

const group: Pokemon[] = [
  {
    dexKind: "standard",
    id: "001",
    dexNumber: "001",
    name: "Bulbasaur",
    specialties: ["Gather"],
    idealHabitat: "Cool",
    favorites: ["Plants"],
  },
];

describe("SharedGroupPreview", () => {
  it("shows the shared plan and hands it back to the add action", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<SharedGroupPreview group={group} onAdd={onAdd} />);

    expect(screen.getByRole("heading", { name: "Someone shared this group with you" })).toBeInTheDocument();
    expect(screen.getByTestId("shared-group-card")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add to My Groups" }));
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
