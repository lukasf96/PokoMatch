const LOCAL_SPRITES_BASE_PATH = "/sprites/pokemon";

/**
 * Sprites are normalized to 128px edge length before WebP encode. Keep in sync with
 * `scripts/pokemon-sprite-collector.ts` (`NORMALIZED_SPRITE_SIZE`).
 */
export function getPokemonSpriteUrl(pokemonId: string): string | null {
  if (!pokemonId) return null;
  return `${LOCAL_SPRITES_BASE_PATH}/${pokemonId}.webp`;
}
