// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { allPokemon } from "../../services/pokemon";
import {
  copySharedGroupUrl,
  createSharedGroupUrl,
  readSharedGroup,
} from "./share-group";

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const originalExecCommand = Object.getOwnPropertyDescriptor(document, "execCommand");

afterEach(() => {
  vi.restoreAllMocks();
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
  if (originalExecCommand) {
    Object.defineProperty(document, "execCommand", originalExecCommand);
  } else {
    Reflect.deleteProperty(document, "execCommand");
  }
});

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

  it("rejects empty and unknown payloads, and caps a valid group at four members", () => {
    const ids = allPokemon.slice(0, 5).map((pokemon) => pokemon.id);

    expect(readSharedGroup("", allPokemon)).toBeNull();
    expect(readSharedGroup("?group=unknown,also-unknown", allPokemon)).toBeNull();
    expect(readSharedGroup(`?group=${ids.join(",")}`, allPokemon)).toEqual({
      pokemonIds: ids.slice(0, 4),
    });
  });

  it("uses the Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await copySharedGroupUrl("https://pokomatch.com/matchmaker?group=001");

    expect(writeText).toHaveBeenCalledWith(
      "https://pokomatch.com/matchmaker?group=001",
    );
  });

  it("falls back to a temporary textarea when the Clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });

    await copySharedGroupUrl("https://pokomatch.com/matchmaker?group=001");

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).not.toBeInTheDocument();
  });
});
