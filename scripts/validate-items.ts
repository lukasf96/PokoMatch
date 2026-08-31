/**
 * Validates required item fields, unique item IDs, and favoriteCategories
 * integrity against the favorites values that exist in pokedex.json.
 *
 * Exits non-zero and prints every issue found.
 */
import { readFile } from "node:fs/promises";
import { resolveAppAssetPath } from "./utility/script-utils";
import { favoriteKey } from "../src/utils/favorites";

const POKEDEX_PATH = resolveAppAssetPath("pokedex.json");
const ITEMS_PATH = resolveAppAssetPath("items.json");

interface PokedexEntry {
  favorites: string[];
}
interface PokedexJson {
  standard: PokedexEntry[];
  event: PokedexEntry[];
  basin: PokedexEntry[];
}

interface ValidationIssue {
  item: string;
  problem: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function itemLabel(item: Record<string, unknown>, index: number): string {
  const name = item.name;
  const id = item.id;
  if (typeof name === "string" && name.trim()) return name;
  if (typeof id === "string" && id.trim()) return id;
  return `item at index ${String(index)}`;
}

async function main(): Promise<void> {
  const [pokedexRaw, itemsRaw] = await Promise.all([
    readFile(POKEDEX_PATH, "utf8"),
    readFile(ITEMS_PATH, "utf8"),
  ]);

  const pokedex = JSON.parse(pokedexRaw) as PokedexJson;
  const itemsJson = JSON.parse(itemsRaw) as unknown;
  if (!isRecord(itemsJson) || !Array.isArray(itemsJson.items)) {
    throw new Error('items.json must contain an "items" array.');
  }

  const knownFavorites = new Set<string>();
  for (const entry of [
    ...pokedex.standard,
    ...pokedex.event,
    ...pokedex.basin,
  ]) {
    for (const fav of entry.favorites) knownFavorites.add(favoriteKey(fav));
  }

  console.error(`Known favorite strings: ${String(knownFavorites.size)}`);
  console.error(`Items to validate: ${String(itemsJson.items.length)}`);

  const issues: ValidationIssue[] = [];
  const firstIndexById = new Map<string, number>();
  const requiredFields = ["id", "name", "category"] as const;

  for (const [index, value] of itemsJson.items.entries()) {
    if (!isRecord(value)) {
      issues.push({
        item: `item at index ${String(index)}`,
        problem: "entry must be an object",
      });
      continue;
    }

    const label = itemLabel(value, index);
    for (const field of requiredFields) {
      const fieldValue = value[field];
      if (typeof fieldValue !== "string" || !fieldValue.trim()) {
        issues.push({
          item: label,
          problem: `required field ${JSON.stringify(field)} must be a non-empty string`,
        });
      }
    }

    const id = value.id;
    if (typeof id === "string" && id.trim()) {
      const firstIndex = firstIndexById.get(id);
      if (firstIndex === undefined) {
        firstIndexById.set(id, index);
      } else {
        issues.push({
          item: label,
          problem: `duplicate id ${JSON.stringify(id)} (first used at index ${String(firstIndex)})`,
        });
      }
    }

    const favoriteCategories = value.favoriteCategories;
    if (!Array.isArray(favoriteCategories)) {
      issues.push({
        item: label,
        problem: 'field "favoriteCategories" must be an array',
      });
      continue;
    }

    const seenFavorites = new Set<string>();
    const duplicateFavorites = new Set<string>();
    const unknownFavorites = new Set<string>();
    for (const favorite of favoriteCategories) {
      if (typeof favorite !== "string") {
        issues.push({
          item: label,
          problem: "favoriteCategories entries must be strings",
        });
        continue;
      }
      const key = favoriteKey(favorite);
      if (seenFavorites.has(key)) duplicateFavorites.add(favorite);
      seenFavorites.add(key);
      if (!knownFavorites.has(key)) unknownFavorites.add(favorite);
    }

    if (duplicateFavorites.size > 0) {
      issues.push({
        item: label,
        problem: `duplicate favoriteCategories: ${[...duplicateFavorites]
          .map((favorite) => JSON.stringify(favorite))
          .join(", ")}`,
      });
    }
    if (unknownFavorites.size > 0) {
      issues.push({
        item: label,
        problem: `unknown favoriteCategories: ${[...unknownFavorites]
          .map((favorite) => JSON.stringify(favorite))
          .join(", ")}`,
      });
    }
  }

  if (issues.length === 0) {
    console.log("OK: item fields, IDs, and favoriteCategories are valid.");
    return;
  }

  console.error(`\nERROR: found ${String(issues.length)} item integrity issue(s):\n`);
  for (const { item, problem } of issues) {
    console.error(`  ${item}: ${problem}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
