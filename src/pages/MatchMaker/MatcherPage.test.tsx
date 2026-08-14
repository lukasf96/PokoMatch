// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { habitablePokemon } from "../../services/pokemon";
import { useStore } from "../../store/store";
import MatcherPage from "./MatcherPage";

vi.mock("./useAutoGroups", () => ({
  useAutoGroups: () => ({ groups: [], isRecomputing: false }),
}));
vi.mock("./components/AutoGroupsSection", () => ({
  AutoGroupsSection: () => <div data-testid="auto-groups" />,
}));
vi.mock("./components/CustomGroupsSection", () => ({
  CustomGroupsSection: () => <div data-testid="custom-groups" />,
}));
vi.mock("./components/SharedGroupPreview", () => ({
  SharedGroupPreview: ({ group, onAdd }: { group: { name: string }[]; onAdd: () => void }) => (
    <section>
      <p>Shared: {group.map((pokemon) => pokemon.name).join(", ")}</p>
      <button onClick={onAdd}>Add shared group</button>
    </section>
  ),
}));
vi.mock("../../components/AppToast", () => ({ AppToast: () => null }));
vi.mock("../../components/ScrollToTopFab", () => ({ ScrollToTopFab: () => null }));

describe("MatcherPage shared links", () => {
  const sharedIds = habitablePokemon.slice(0, 2).map((pokemon) => pokemon.id);

  beforeEach(() => {
    localStorage.clear();
    useStore.setState({
      unlockedIds: new Set(),
      customGroups: [],
      preferEvolutionLinesInMatching: false,
    });
    window.history.replaceState({}, "", `/matchmaker?group=${sharedIds.join(",")}`);
  });

  it("shows a valid shared group even before its members are unlocked, then adopts it", async () => {
    const user = userEvent.setup();
    render(<MatcherPage />);

    expect(screen.getByText(/^Shared:/)).toHaveTextContent(
      habitablePokemon
        .filter((pokemon) => sharedIds.includes(pokemon.id))
        .map((pokemon) => pokemon.name)
        .join(", "),
    );
    await user.click(screen.getByRole("button", { name: "Add shared group" }));

    await waitFor(() => {
      expect(useStore.getState().unlockedIds).toEqual(new Set(sharedIds));
      expect(useStore.getState().customGroups).toHaveLength(1);
    });
    expect(useStore.getState().customGroups[0]?.pokemonIds).toEqual(sharedIds);
    expect(window.location.search).toBe("");
    expect(screen.queryByText(/^Shared:/)).not.toBeInTheDocument();
  });
});
