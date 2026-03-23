const LOCAL_SPRITES_BASE_PATH = "/sprites/pokemon";

export function getPokemonSpriteUrl(pokemonId: string): string | null {
  if (!pokemonId) return null;
  return `${LOCAL_SPRITES_BASE_PATH}/${pokemonId}.png`;
}
