// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AppRouter from "./AppRouter";

const routeState = vi.hoisted(() => ({ suspendHome: false }));

vi.mock("./lazyPages", () => ({
  HomePage: () => {
    if (routeState.suspendHome) throw new Promise(() => {});
    return <h1>Home test page</h1>;
  },
  MatcherPage: () => <h1>Matcher test page</h1>,
  InsightsPage: () => <h1>Insights test page</h1>,
  PokedexPage: () => <h1>Pokedex test page</h1>,
}));

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
      <CurrentPath />
    </MemoryRouter>,
  );
}

describe("AppRouter", () => {
  it.each([
    ["/", "Home test page"],
    ["/matchmaker", "Matcher test page"],
    ["/insights", "Insights test page"],
    ["/pokedex", "Pokedex test page"],
  ])("renders %s", (path, heading) => {
    renderAt(path);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByLabelText("Current path")).toHaveTextContent(path);
  });

  it("redirects unknown paths to home", async () => {
    renderAt("/not-found");

    await waitFor(() =>
      expect(screen.getByLabelText("Current path")).toHaveTextContent("/"),
    );
    expect(screen.getByRole("heading", { name: "Home test page" })).toBeInTheDocument();
  });

  it("shows the application fallback while a lazy route is suspended", () => {
    routeState.suspendHome = true;
    renderAt("/");

    expect(screen.getByLabelText("Loading page")).toBeInTheDocument();
    routeState.suspendHome = false;
  });
});
