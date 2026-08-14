// @vitest-environment jsdom

import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DocumentTitle } from "./DocumentTitle";

describe("DocumentTitle", () => {
  it.each([
    ["/", "PokoMatch | Pokémon Pokopia Habitat Planner & Roommate Matchmaker"],
    [
      "/matchmaker",
      "Match Maker | Pokopia Habitat Roommate Planner — PokoMatch",
    ],
    ["/insights", "Insights | Pokopia Habitats, Favorites & Items — PokoMatch"],
    ["/pokedex", "Pokédex | Standard, Event & Basin Dex for Pokopia — PokoMatch"],
    [
      "/pokopia-habitat-roommates",
      "Pokopia Habitat & Roommate Compatibility Guide — PokoMatch",
    ],
    [
      "/pokopia-specialty-groups",
      "Pokopia Specialty Groups & Factory Guide — PokoMatch",
    ],
    [
      "/unknown",
      "PokoMatch | Pokémon Pokopia Habitat Planner & Roommate Matchmaker",
    ],
  ])("sets the title for %s", async (path, expectedTitle) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <DocumentTitle />
      </MemoryRouter>,
    );

    await waitFor(() => expect(document.title).toBe(expectedTitle));
  });
});
