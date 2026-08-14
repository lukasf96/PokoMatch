// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Pokemon } from "../../../types/types";
import { ShareGroupImageCard } from "./ShareGroupImageCard";

const groupCard = vi.fn();

vi.mock("./GroupCard", () => ({
  default: (props: unknown) => {
    groupCard(props);
    return <div data-testid="group-card" />;
  },
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

describe("ShareGroupImageCard", () => {
  it("uses a light CSS-variable boundary and exports a label-free GroupCard", () => {
    const { container } = render(<ShareGroupImageCard group={group} />);
    const exportRoot = container.firstElementChild as HTMLElement;

    expect(exportRoot.style.getPropertyValue("--mui-palette-background-paper")).toBe(
      "#ffffff",
    );
    expect(screen.getByAltText("PokoMatch")).toBeInTheDocument();
    expect(screen.getByText("Habitat planned with PokoMatch.com")).toBeInTheDocument();
    expect(groupCard).toHaveBeenCalledWith(
      expect.objectContaining({
        group,
        groupNumber: 1,
        habitat: "Cool",
        showGroupName: false,
      }),
    );
  });
});
