import {
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { alpha } from "@mui/material/styles";
import { memo, type ReactNode, useMemo } from "react";
import { PokemonSpriteAvatar } from "../../../components/pokemon-sprite-avatar/PokemonSpriteAvatar";
import {
  getGroupConflicts,
  getGroupHabitats,
} from "../../../services/habitat-conflicts";
import { getHabitatColors, habitatIcons } from "../../../services/habitatColors";
import { groupScore } from "../../../services/matching.service";
import { getPokemonDisplayName } from "../../../services/pokemon-localization";
import { useStore } from "../../../store/store";
import type { Habitat, Pokemon } from "../../../types/types";

interface GroupCardProps {
  group: Pokemon[];
  groupNumber: number;
  habitat: Habitat;
  onRemovePokemon?: (pokemonId: string) => void;
  footerContent?: ReactNode;
  groupAction?: {
    ariaLabel: string;
    onClick: () => void;
    kind: "add" | "remove";
  };
}

function isEventPokemon(p: Pokemon): boolean {
  return p.id.startsWith("e");
}

interface HabitatAccentColors {
  bg: string;
  text: string;
  border: string;
}

function MemberFavoritesList({
  favorites,
  favCounts,
  accent,
}: {
  favorites: string[];
  favCounts: Record<string, number>;
  accent: HabitatAccentColors;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const sorted = useMemo(() => {
    const copy = [...favorites];
    copy.sort((a, b) => {
      const sa = (favCounts[a] ?? 0) >= 2 ? 1 : 0;
      const sb = (favCounts[b] ?? 0) >= 2 ? 1 : 0;
      if (sb !== sa) return sb - sa;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
    return copy;
  }, [favorites, favCounts]);

  if (favorites.length === 0) {
    return (
      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
        No favorites listed
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}
      >
        Favorites
      </Typography>
      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          border: "1px solid",
          borderColor: isDark ? alpha(accent.border, 0.35) : alpha(accent.border, 0.22),
          bgcolor: isDark ? alpha(accent.border, 0.12) : alpha(accent.border, 0.06),
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
        }}
      >
        {sorted.map((fav) => {
          const isShared = (favCounts[fav] ?? 0) >= 2;
          return (
            <Chip
              key={fav}
              label={fav}
              size="small"
              icon={
                isShared ? (
                  <FavoriteIcon sx={{ fontSize: 14, width: 14, height: 14 }} aria-hidden />
                ) : undefined
              }
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: isShared ? 600 : 500,
                borderRadius: "6px",
                bgcolor: isShared
                  ? isDark
                    ? alpha(accent.bg, 0.55)
                    : alpha("#ffffff", 0.85)
                  : isDark
                    ? alpha(theme.palette.common.black, 0.22)
                    : alpha(theme.palette.common.black, 0.04),
                color: isShared ? accent.text : "text.secondary",
                border: "1px solid",
                borderColor: isShared
                  ? alpha(accent.border, isDark ? 0.85 : 0.55)
                  : isDark
                    ? alpha(theme.palette.divider, 0.6)
                    : theme.palette.divider,
                "& .MuiChip-icon": {
                  color: isShared ? accent.border : undefined,
                  ml: 0.35,
                },
              }}
            />
          );
        })}
      </Box>
    </Stack>
  );
}

function PokemonIdentity({
  pokemon,
  onRemovePokemon,
}: {
  pokemon: Pokemon;
  onRemovePokemon?: (pokemonId: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const nameLanguage = useStore((state) => state.nameLanguage);
  const pokemonDisplayName = getPokemonDisplayName(pokemon, nameLanguage);
  const eventChipStyles = {
    height: 14,
    fontSize: 9,
    flexShrink: 0,
  };

  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      mb={0.75}
      minWidth={0}
    >
      <PokemonSpriteAvatar pokemon={pokemon} size={56} padding={0.75} />
      <Stack
        direction="column"
        spacing={0.5}
        alignItems="flex-start"
        justifyContent="center"
        minWidth={0}
        sx={{ flex: 1 }}
      >
        <Typography
          variant="body2"
          color="text.disabled"
          sx={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}
        >
          #{pokemon.dexNumber}
        </Typography>
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          minWidth={0}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              fontSize: 13,
              lineHeight: 1.3,
              color: "text.primary",
            }}
          >
            {pokemonDisplayName}
          </Typography>
          {isEventPokemon(pokemon) && (
            <Chip
              label="Event"
              size="small"
              sx={{
                ...eventChipStyles,
                bgcolor: isDark ? "secondary.dark" : "secondary.light",
                color: isDark ? "secondary.contrastText" : "secondary.dark",
              }}
            />
          )}
        </Stack>
        <HabitatChip habitat={pokemon.idealHabitat} variant="pokemon" />
      </Stack>
      {onRemovePokemon && (
        <IconButton
          size="small"
          aria-label={`Remove ${pokemonDisplayName}`}
          onClick={() => onRemovePokemon(pokemon.id)}
          sx={{ flexShrink: 0, ml: -0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );
}

function GroupCardComponent({
  group,
  groupNumber,
  habitat,
  onRemovePokemon,
  footerContent,
  groupAction,
}: GroupCardProps) {
  const theme = useTheme();
  const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);
  const colors = habitatColors[habitat];

  const { favCounts, score, habitats, conflicts } = useMemo(() => {
    const allFavs = group.flatMap((p) => p.favorites);
    const counts = allFavs.reduce<Record<string, number>>((acc, f) => {
      acc[f] = (acc[f] ?? 0) + 1;
      return acc;
    }, {});
    return {
      favCounts: counts,
      score: groupScore(group),
      habitats: getGroupHabitats(group),
      conflicts: getGroupConflicts(group),
    };
  }, [group]);

  const dividerColor = theme.palette.divider;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: colors.border,
        borderRadius: 2,
        overflow: "hidden",
        transition: theme.transitions.create(["box-shadow"], {
          duration: theme.transitions.duration.shortest,
        }),
        "&:hover": {
          boxShadow: theme.shadows[2],
        },
      }}
    >
      <Box
        sx={{
          bgcolor: colors.bg,
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color={colors.text}>
          Group {groupNumber}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          {habitats.map((groupHabitat) => (
            <HabitatChip
              key={`habitat-${groupHabitat}`}
              habitat={groupHabitat}
              variant="group"
            />
          ))}
          {conflicts.length > 0 && (
            <Chip
              label={`Conflict: ${conflicts.map(([left, right]) => `${left}/${right}`).join(", ")}`}
              size="small"
              color="error"
              variant="filled"
              sx={{ fontSize: 11, height: 20 }}
            />
          )}
          <Chip
            label={`Score ${score}`}
            size="small"
            sx={{
              bgcolor: colors.border,
              color: "common.white",
              fontSize: 11,
              height: 20,
            }}
          />
          {groupAction && (
            <IconButton
              size="small"
              aria-label={groupAction.ariaLabel}
              onClick={groupAction.onClick}
            >
              {groupAction.kind === "add" ? (
                <AddIcon fontSize="small" />
              ) : (
                <DeleteOutlineIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </Stack>
      </Box>
      <Divider />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {group.map((pokemon, pi) => (
          <Box
            key={pokemon.id}
            sx={{
              flex: "1 1 260px",
              p: 1.75,
              borderRight:
                pi < group.length - 1 ? `1px solid ${dividerColor}` : "none",
              minWidth: 0,
            }}
          >
            <PokemonIdentity pokemon={pokemon} onRemovePokemon={onRemovePokemon} />
            <MemberFavoritesList
              favorites={pokemon.favorites}
              favCounts={favCounts}
              accent={colors}
            />
          </Box>
        ))}
      </Box>
      {footerContent && (
        <>
          <Divider />
          <Box sx={{ px: 1.5, py: 1.25, bgcolor: "action.hover" }}>
            {footerContent}
          </Box>
        </>
      )}
    </Paper>
  );
}

function HabitatChip({
  habitat,
  variant,
}: {
  habitat: Habitat;
  variant: "group" | "pokemon";
}) {
  const theme = useTheme();
  const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);
  const HabitatIcon = habitatIcons[habitat];
  const isGroup = variant === "group";

  return (
    <Chip
      icon={<HabitatIcon />}
      label={habitat}
      size="small"
      variant="outlined"
      sx={{
        height: isGroup ? 20 : 18,
        fontSize: 10,
        bgcolor: "background.paper",
        color: habitatColors[habitat].text,
        borderColor: habitatColors[habitat].border,
        "& .MuiChip-icon": {
          color: habitatColors[habitat].text,
          ml: 0.5,
          fontSize: 14,
        },
      }}
    />
  );
}

export default memo(GroupCardComponent);
