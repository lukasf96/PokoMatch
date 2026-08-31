/** Case-insensitive key for comparing favorite (and flavor) labels. */
export function favoriteKey(value: string): string {
  return value.trim().toLowerCase();
}

/** Set of {@link favoriteKey} values for every favorite in the group. */
export function groupFavoriteKeys(group: { favorites: string[] }[]): Set<string> {
  const keys = new Set<string>();
  for (const member of group) {
    for (const favorite of member.favorites) keys.add(favoriteKey(favorite));
  }
  return keys;
}
