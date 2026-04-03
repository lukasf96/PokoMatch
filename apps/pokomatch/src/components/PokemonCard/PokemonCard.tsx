import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import StarsIcon from "@mui/icons-material/Stars";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useMemo } from "react";
import {
  getHabitatColors,
  habitatIcons,
  type HabitatColorSet,
} from "../../services/habitatColors";
import { getPokemonDisplayName } from "../../services/pokemon-localization";
import { useStore } from "../../store/store";
import type { Habitat, Pokemon } from "../../types/types";
import { PokemonSpriteAvatar } from "../PokemonSpriteAvatar";

export interface PokemonCardProps {
  pokemon: Pokemon;
  unlocked?: boolean;
  interactive?: boolean;
  onToggle?: (id: string) => void;
  onRemove?: (id: string) => void;
  showHabitat?: boolean;
  showFlavor?: boolean;
  showFavorites?: boolean;
  showSpecialties?: boolean;
  favoriteCounts?: Record<string, number>;
  universalFavorites?: Set<string>;
  sx?: SxProps<Theme>;
}

/**
 * A unified Pokemon Card component used in both Pokedex and MatchMaker pages.
 * Displays Pokemon identity, habitat, specialty, flavor, and favorites.
 */
export const PokemonCard = memo(function PokemonCard({
  pokemon,
  unlocked = true,
  interactive = false,
  onToggle,
  onRemove,
  showHabitat = true,
  showFlavor = true,
  showFavorites = true,
  showSpecialties = true,
  favoriteCounts,
  universalFavorites,
  sx,
}: PokemonCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const nameLanguage = useStore((state) => state.nameLanguage);
  const pokemonDisplayName = getPokemonDisplayName(pokemon, nameLanguage);
  const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);
  const colors = habitatColors[pokemon.idealHabitat as Habitat];
  const HabitatIcon = habitatIcons[pokemon.idealHabitat as Habitat];
  const isNotHabitable = pokemon.isHabitable === false;

  function handleToggle() {
    if (interactive && onToggle) {
      onToggle(pokemon.id);
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(pokemon.id);
    }
  };

  const metaChipStyles = {
    height: 16,
    fontSize: 9,
    fontWeight: 700,
    borderRadius: "4px",
    textTransform: "uppercase",
  };

  const sortedFavorites = useMemo(() => {
    const favs = pokemon.favorites;
    if (!favoriteCounts || !universalFavorites) {
      return favs;
    }
    const copy = [...favs];
    copy.sort((a, b) => {
      const ua = universalFavorites.has(a) ? 1 : 0;
      const ub = universalFavorites.has(b) ? 1 : 0;
      if (ub !== ua) return ub - ua;
      const sa = (favoriteCounts[a] ?? 0) >= 2 ? 1 : 0;
      const sb = (favoriteCounts[b] ?? 0) >= 2 ? 1 : 0;
      if (sb !== sa) return sb - sa;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
    return copy;
  }, [pokemon.favorites, favoriteCounts, universalFavorites]);

  return (
    <Paper
      variant="outlined"
      onClick={interactive ? handleToggle : undefined}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        cursor: interactive ? "pointer" : "default",
        opacity: unlocked ? 1 : 0.45,
        borderColor: unlocked ? colors.border : "divider",
        transition: theme.transitions.create(
          ["opacity", "border-color", "box-shadow", "transform"],
          {
            duration: theme.transitions.duration.shortest,
          },
        ),
        "&:hover": interactive
          ? {
              opacity: unlocked ? 1 : 0.65,
            }
          : undefined,
        userSelect: "none",
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      {/* Header section with Sprite and Name */}
      <Box
        sx={{
          bgcolor: unlocked ? colors.bg : "action.disabledBackground",
          px: 1.5,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          transition: "background-color 0.15s",
        }}
      >
        <PokemonSpriteAvatar pokemon={pokemon} size={56} padding={0.75} />

        <Stack direction="column" spacing={0.25} minWidth={0} sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: unlocked ? alpha(colors.text, 0.7) : "text.disabled",
              letterSpacing: "0.02em",
            }}
          >
            #{pokemon.dexNumber}
          </Typography>

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography
              variant="body2"
              fontWeight={800}
              sx={{
                fontSize: 14,
                lineHeight: 1.2,
                color: unlocked ? colors.text : "text.secondary",
              }}
            >
              {pokemonDisplayName}
            </Typography>

            {isNotHabitable && (
              <Chip
                label="Not habitable"
                size="small"
                sx={{
                  ...metaChipStyles,
                  bgcolor: isDark ? "warning.dark" : "warning.light",
                  color: isDark ? "warning.contrastText" : "warning.dark",
                }}
              />
            )}
          </Stack>
        </Stack>

        {interactive && (
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
            {unlocked ? (
              <CheckBoxIcon sx={{ fontSize: 24, color: colors.text }} />
            ) : (
              <CheckBoxOutlineBlankIcon
                sx={{ fontSize: 24, color: "text.disabled" }}
              />
            )}
          </Box>
        )}

        {onRemove && (
          <IconButton
            size="small"
            onClick={handleRemove}
            sx={{
              ml: "auto",
              color: unlocked ? colors.text : "text.disabled",
              "&:hover": { bgcolor: alpha(colors.text, 0.1) },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Body section with attributes and favorites */}
      <Box sx={{ px: 1.5, py: 1.5 }}>
        {/* Core Attributes: Habitat, Flavor, Specialties */}
        <Stack
          spacing={1.25}
          mb={showFavorites && pokemon.favorites.length > 0 ? 1.5 : 0}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {showHabitat && (
              <AttributeItem
                icon={<HabitatIcon sx={{ fontSize: 16 }} />}
                label={pokemon.idealHabitat}
                color={colors.text}
              />
            )}

            {showFlavor && pokemon.favoriteFlavor && (
              <AttributeItem
                icon={<RestaurantIcon sx={{ fontSize: 16 }} />}
                label={pokemon.favoriteFlavor}
                color="text.secondary"
              />
            )}
          </Box>

          {showSpecialties && pokemon.specialties.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {pokemon.specialties.map((specialty) => (
                <Chip
                  key={specialty}
                  label={specialty}
                  size="small"
                  icon={<StarsIcon sx={{ fontSize: "14px !important" }} />}
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 600,
                    bgcolor: isDark
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.08),
                    color: "primary.main",
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    "& .MuiChip-icon": { color: "inherit" },
                  }}
                />
              ))}
            </Box>
          )}
        </Stack>

        {/* Favorites Section */}
        {showFavorites && pokemon.favorites.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.75,
                fontSize: 10,
                fontWeight: 700,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Favorites
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {sortedFavorites.map((fav) => {
                const isUniversal = universalFavorites?.has(fav);
                const isShared = (favoriteCounts?.[fav] ?? 0) >= 2;

                return (
                  <FavoriteChip
                    key={fav}
                    label={fav}
                    isUniversal={isUniversal}
                    isShared={isShared}
                    accent={colors}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
});

function AttributeItem({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Box sx={{ display: "flex", color }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 500, color }}>
        {label}
      </Typography>
    </Stack>
  );
}

function FavoriteChip({
  label,
  isUniversal,
  isShared,
  accent,
}: {
  label: string;
  isUniversal?: boolean;
  isShared?: boolean;
  accent: HabitatColorSet;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const getSx = () => {
    if (isUniversal || isShared) {
      return {
        height: 22,
        fontSize: 11,
        fontWeight: 600,
        borderRadius: "6px",
        bgcolor: isDark ? alpha(accent.bg, 0.55) : alpha("#ffffff", 0.85),
        color: accent.text,
        border: "1px solid",
        borderColor: alpha(accent.border, isDark ? 0.85 : 0.55),
        "& .MuiChip-icon": {
          color: accent.border,
          ml: 0.35,
        },
      };
    }

    return {
      height: 20,
      fontSize: 10,
      fontWeight: 500,
      borderRadius: "4px",
      bgcolor: isDark ? alpha(theme.palette.common.white, 0.05) : "grey.50",
      color: "text.secondary",
      border: "1px solid",
      borderColor: isDark
        ? alpha(theme.palette.divider, 0.5)
        : theme.palette.divider,
    };
  };

  return (
    <Chip
      label={label}
      size="small"
      icon={
        isUniversal ? (
          <AutoAwesomeIcon sx={{ fontSize: 13 }} />
        ) : isShared ? (
          <FavoriteIcon sx={{ fontSize: 13 }} />
        ) : undefined
      }
      sx={getSx()}
      title={
        isUniversal
          ? "Every Pokémon in this group has this favorite"
          : isShared
            ? "Shared with at least one other Pokémon in this group"
            : undefined
      }
    />
  );
}
