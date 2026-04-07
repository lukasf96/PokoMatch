/**
 * Validates that every favoriteCategories string in items.json matches
 * a favorites value that exists in pokedex.json.
 *
 * Exits non-zero and prints offenders if any unknown strings are found.
 */
import { readFile } from "node:fs/promises";
import { resolveAppAssetPath } from "./script-utils";

const POKEDEX_PATH = resolveAppAssetPath("pokedex.json");
const ITEMS_PATH = resolveAppAssetPath("items.json");

interface PokedexEntry {
  favorites: string[];
}
interface PokedexJson {
  standard: PokedexEntry[];
  event: PokedexEntry[];
}

interface ItemEntry {
  id: string;
  name: string;
  favoriteCategories: string[];
}
interface ItemsJson {
  items: ItemEntry[];
}

async function main(): Promise<void> {
  const [pokedexRaw, itemsRaw] = await Promise.all([
    readFile(POKEDEX_PATH, "utf8"),
    readFile(ITEMS_PATH, "utf8"),
  ]);

  const pokedex = JSON.parse(pokedexRaw) as PokedexJson;
  const itemsJson = JSON.parse(itemsRaw) as ItemsJson;

  const knownFavorites = new Set<string>();
  for (const entry of [...pokedex.standard, ...pokedex.event]) {
    for (const fav of entry.favorites) knownFavorites.add(fav);
  }

  console.error(`Known favorite strings: ${String(knownFavorites.size)}`);
  console.error(`Items to validate: ${String(itemsJson.items.length)}`);

  const offenders: { item: string; unknown: string[] }[] = [];

  for (const item of itemsJson.items) {
    const unknown = item.favoriteCategories.filter(
      (fc) => !knownFavorites.has(fc),
    );
    if (unknown.length > 0) offenders.push({ item: item.name, unknown });
  }

  if (offenders.length === 0) {
    console.log("OK: all item favoriteCategories match Pokédex favorites.");
    return;
  }

  console.error(
    `\nERROR: ${String(offenders.length)} item(s) have unknown favoriteCategories:\n`,
  );
  for (const { item, unknown } of offenders) {
    console.error(`  ${item}: ${unknown.map((s) => JSON.stringify(s)).join(", ")}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
