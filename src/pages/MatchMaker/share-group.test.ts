import { describe, expect, it } from "vitest";
import { allPokemon } from "../../services/pokemon";
import { createSharedGroupUrl, readSharedGroup } from "./share-group";

describe("group sharing", () => {
  it("encodes only the group and its optional in-game location", () => {
    const url = createSharedGroupUrl(
      { pokemonIds: ["bulbasaur", "charmander"], location: "Palette Town" },
      "https://pokomatch.com",
    );
    expect(url).toBe(
      "https://pokomatch.com/matchmaker?group=bulbasaur%2Ccharmander&location=Palette+Town",
    );
  });

  it("only accepts known, unique IDs and a valid location", () => {
    const ids = allPokemon.slice(0, 2).map((pokemon) => pokemon.id);
    const result = readSharedGroup(
      `?group=${ids[0]},unknown,${ids[0]},${ids[1]}&location=Palette%20Town`,
      allPokemon,
    );
    expect(result).toEqual({ pokemonIds: ids, location: "Palette Town" });
  });
});
