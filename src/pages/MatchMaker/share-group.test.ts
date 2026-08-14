import { describe, expect, it } from "vitest";
import { allPokemon } from "../../services/pokemon";
import { createSharedGroupUrl, readSharedGroup } from "./share-group";

describe("group sharing", () => {
  it("encodes only the group Pokémon IDs", () => {
    const url = createSharedGroupUrl(
      { pokemonIds: ["bulbasaur", "charmander"] },
      "https://pokomatch.com",
    );
    expect(url).toBe(
      "https://pokomatch.com/matchmaker?group=bulbasaur%2Ccharmander",
    );
  });

  it("only accepts known, unique IDs and ignores location", () => {
    const ids = allPokemon.slice(0, 2).map((pokemon) => pokemon.id);
    const result = readSharedGroup(
      `?group=${ids[0]},unknown,${ids[0]},${ids[1]}&location=Palette%20Town`,
      allPokemon,
    );
    expect(result).toEqual({ pokemonIds: ids });
  });
});
