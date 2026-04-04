import rawData from "../assets/items.json";
import type { Item, Pokemon, SuggestedItem } from "../types/types";

type ItemJson = Item;

export const allItems: Item[] = rawData.items as ItemJson[];

/**
 * Suggest items for a group of Pokémon, ranked by the number of
 * `favoriteCategories` that overlap with the union of the group's `favorites`.
 *
 * Items with score 0 (no overlap) are excluded from the result.
 */
export function suggestItemsForGroup(
  group: Pokemon[],
  items: Item[] = allItems,
  limit = 5,
): SuggestedItem[] {
  if (group.length === 0 || items.length === 0) return [];

  const groupFavorites = new Set(group.flatMap((p) => p.favorites));
  if (groupFavorites.size === 0) return [];

  return items
    .map((item) => {
      const score = item.favoriteCategories.filter((fc) =>
        groupFavorites.has(fc),
      ).length;
      return { item, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      const d = b.score - a.score;
      if (d !== 0) return d;
      return a.item.name.localeCompare(b.item.name);
    })
    .slice(0, limit);
}
