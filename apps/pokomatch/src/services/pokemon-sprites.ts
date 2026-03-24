const LOCAL_SPRITES_BASE_PATH = "/sprites/pokemon";

/**
 * Max edge length before WebP encode in px. Keep in sync with
 * `scripts/vendor-pokemon-sprites.mjs` (`NORMALIZED_SPRITE_SIZE`).
 */
export const VENDORED_POKEMON_SPRITE_PX = 128;

export function getPokemonSpriteUrl(pokemonId: string): string | null {
  if (!pokemonId) return null;
  return `${LOCAL_SPRITES_BASE_PATH}/${pokemonId}.webp`;
}
