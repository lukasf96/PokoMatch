import { Avatar } from "@mui/material";
import { memo, useMemo, useState } from "react";
import { getPokemonSpriteUrl } from "../../services/pokemon-sprites";
import type { Pokemon } from "../../types/types";

interface PokemonSpriteAvatarProps {
  pokemon: Pokemon;
  size?: number;
  padding?: number;
}

export const PokemonSpriteAvatar = memo(function PokemonSpriteAvatar({
  pokemon,
  size = 24,
  padding = 0.25,
}: PokemonSpriteAvatarProps) {
  const [hasSpriteError, setHasSpriteError] = useState(false);
  const spriteUrl = useMemo(() => getPokemonSpriteUrl(pokemon.id), [pokemon.id]);
  const shouldShowSprite = spriteUrl !== null && !hasSpriteError;

  return (
    <Avatar
      src={shouldShowSprite ? spriteUrl : undefined}
      imgProps={{
        loading: "lazy",
        width: 40,
        height: 40,
        onError: () => setHasSpriteError(true),
      }}
      alt={pokemon.name}
      variant="rounded"
      sx={{
        width: size,
        height: size,
        p: padding,
        bgcolor: "transparent",
        border: "1px solid",
        borderColor: "divider",
        flexShrink: 0,
      }}
    />
  );
});
