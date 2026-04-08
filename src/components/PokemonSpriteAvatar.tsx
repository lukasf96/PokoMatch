import { Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useMemo, useState } from "react";
import { getPokemonSpriteUrl } from "../services/pokemon-sprites";
import type { Pokemon } from "../types/types";

interface PokemonSpriteAvatarProps {
  pokemon: Pokemon;
  /** Display size in px (vendored assets are larger for sharp downsampling). */
  size?: number;
  padding?: number;
}

export const PokemonSpriteAvatar = memo(function PokemonSpriteAvatar({
  pokemon,
  size = 44,
  padding = 0.5,
}: PokemonSpriteAvatarProps) {
  const [hasSpriteError, setHasSpriteError] = useState(false);
  const spriteUrl = useMemo(
    () => getPokemonSpriteUrl(pokemon.id),
    [pokemon.id],
  );
  const shouldShowSprite = spriteUrl !== null && !hasSpriteError;

  return (
    <Avatar
      src={shouldShowSprite ? spriteUrl : undefined}
      slotProps={{
        img: {
          loading: "lazy",
          width: size,
          height: size,
          onError: () => setHasSpriteError(true),
        },
      }}
      alt={pokemon.name}
      variant="rounded"
      sx={{
        width: size,
        height: size,
        p: padding,
        flexShrink: 0,
        bgcolor: (theme) =>
          theme.palette.mode === "dark"
            ? alpha(theme.palette.common.white, 0.08)
            : alpha(theme.palette.common.black, 0.05),
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark"
            ? alpha(theme.palette.common.white, 0.12)
            : theme.palette.divider,
        borderRadius: "5px",
        boxShadow: "none",
        "& img": {
          objectFit: "contain",
        },
      }}
    />
  );
});
