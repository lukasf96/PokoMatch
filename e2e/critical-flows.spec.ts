import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function waitForPersistedState(page: Page, predicate: (state: unknown) => boolean) {
  await expect
    .poll(async () => {
      const state = await page.evaluate(() => {
        const raw = localStorage.getItem("pokomatch");
        return raw ? JSON.parse(raw).state : null;
      });
      return predicate(state);
    })
    .toBe(true);
}

test("Pokédex choices flow into custom groups and survive a reload", async ({ page }) => {
  await page.goto("/pokedex");
  await expect(page.getByRole("heading", { name: "Pokopia Pokédex" })).toBeVisible();

  await page.getByRole("button", { name: "Lock all", exact: true }).first().click();
  await page.getByPlaceholder("Search by name or #...").fill("Bulbasaur");
  await expect(page.getByText(/Showing 1 of \d+ Pokémon/)).toBeVisible();
  await page.getByText("Bulbasaur", { exact: true }).click();

  await waitForPersistedState(
    page,
    (value) =>
      typeof value === "object" &&
      value !== null &&
      Array.isArray((value as { unlockedIds?: unknown }).unlockedIds) &&
      (value as { unlockedIds: unknown[] }).unlockedIds.includes("001"),
  );

  await page.getByRole("link", { name: /Match-Maker/ }).click();
  await expect(page.getByRole("heading", { name: "Match Maker" })).toBeVisible();
  await page.getByRole("button", { name: "Add group" }).first().click();

  const pokemonSearch = page.getByRole("combobox", {
    name: "Search for a Pokémon to add to this group",
  });
  await pokemonSearch.fill("Bulbasaur");
  await page.getByRole("option", { name: /Bulbasaur/ }).click();

  await waitForPersistedState(
    page,
    (value) =>
      typeof value === "object" &&
      value !== null &&
      Array.isArray((value as { customGroups?: unknown }).customGroups) &&
      (
        value as {
          customGroups: Array<{ pokemonIds?: unknown[] }>;
        }
      ).customGroups.some((group) => group.pokemonIds?.includes("001")),
  );

  await page.reload();
  await expect(page.getByText("My Groups", { exact: true })).toBeVisible();
  await expect(page.getByText("Bulbasaur", { exact: true })).toBeVisible();
});

test("production route chunks render through the primary navigation", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /Insights/ }).click();
  await expect(page).toHaveURL(/\/insights$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: /Pokédex/ }).click();
  await expect(page).toHaveURL(/\/pokedex$/);
  await expect(page.getByRole("heading", { name: "Pokopia Pokédex" })).toBeVisible();
});
