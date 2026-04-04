import rawData from "../assets/items.json";
import type { Item, Pokemon, SuggestedItem } from "../types/types";

type ItemJson = Item;

export const allItems: Item[] = rawData.items as ItemJson[];

/**
 * Suggest items for a group of Pokémon.
 *
 * Scoring:
 *   - `pokemonCoverage`: how many Pokémon in the group have ≥1 favorite
 *     satisfied by this item. Primary sort key — directly measures how many
 *     teammates the item makes happy.
 *   - `score`: how many of the item's favoriteCategories overlap with the
 *     group's favorites union. Secondary tiebreaker.
 *
 * Filtering:
 *   - Items with `score === 0` (no overlap at all) are always excluded.
 *   - Items with `score === 1` are excluded unless their single matched
 *     favorite is not covered by any item with score ≥ 2. This prevents
 *     flooding the list with near-useless suggestions while preserving
 *     items that are the only way to address a particular group favorite.
 *
 * Returns all qualifying matches sorted by (pokemonCoverage DESC, score DESC,
 * name ASC). Callers slice to their desired display limit.
 */
export function suggestItemsForGroup(
  group: Pokemon[],
  items: Item[] = allItems,
): SuggestedItem[] {
  if (group.length === 0 || items.length === 0) return [];

  const groupFavorites = new Set(group.flatMap((p) => p.favorites));
  if (groupFavorites.size === 0) return [];

  // Score every item.
  const scored = items.map((item) => {
    const matchedFavs = item.favoriteCategories.filter((fc) =>
      groupFavorites.has(fc),
    );
    const pokemonCoverage = group.filter((p) =>
      p.favorites.some((f) => matchedFavs.includes(f)),
    ).length;
    return { item, score: matchedFavs.length, pokemonCoverage, matchedFavs };
  });

  // Collect favorites already covered by score ≥ 2 items.
  const wellCoveredFavs = new Set<string>();
  for (const s of scored) {
    if (s.score >= 2) {
      for (const f of s.matchedFavs) wellCoveredFavs.add(f);
    }
  }

  return scored
    .filter((s) => {
      if (s.score === 0) return false;
      // Keep score-1 items only when their single matched fav isn't already
      // covered by a higher-scoring item.
      if (s.score === 1) return !wellCoveredFavs.has(s.matchedFavs[0]!);
      return true;
    })
    .map(({ item, score, pokemonCoverage }) => ({ item, score, pokemonCoverage }))
    .sort((a, b) => {
      const dc = b.pokemonCoverage - a.pokemonCoverage;
      if (dc !== 0) return dc;
      const ds = b.score - a.score;
      if (ds !== 0) return ds;
      return a.item.name.localeCompare(b.item.name);
    });
}
