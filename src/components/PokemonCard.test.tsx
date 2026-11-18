// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { allPokemon } from "../services/pokemon";
import { PokemonCard } from "./PokemonCard";

const pokemon = allPokemon[0];

describe("PokemonCard", () => {
  it("is a keyboard-operable checkbox when interactive", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <PokemonCard pokemon={pokemon} interactive unlocked onToggle={onToggle} />,
    );

    const card = screen.getByRole("checkbox", { name: pokemon.name });
    expect(card).toHaveAttribute("aria-checked", "true");

    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenCalledWith(pokemon.id);
  });

  it("is not focusable when not interactive", () => {
    render(<PokemonCard pokemon={pokemon} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("labels the remove button with the Pokémon's name", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<PokemonCard pokemon={pokemon} onRemove={onRemove} />);

    await user.click(
      screen.getByRole("button", { name: `Remove ${pokemon.name}` }),
    );
    expect(onRemove).toHaveBeenCalledWith(pokemon.id);
  });
});
