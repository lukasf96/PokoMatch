import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
import { memo, useMemo, type ReactNode } from "react";
import { PokemonCard } from "../../../components/PokemonCard";
import { SpecialtyChip } from "../../../components/SpecialtyChip";
import {
  getGroupConflicts,
  getGroupHabitats,
} from "../../../services/habitat-conflicts";
import {
  getHabitatColors,
  habitatIcons,
} from "../../../services/habitatColors";
import {
  groupScore,
  groupScoreUpperBound,
} from "../../../services/matching.service";
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

function favoritesEveryoneLikes(group: Pokemon[]): Set<string> {
  if (group.length < 2) return new Set();
  let intersection = new Set(group[0].favorites);
  for (let i = 1; i < group.length; i++) {
    const next = new Set(group[i].favorites);
    intersection = new Set([...intersection].filter((f) => next.has(f)));
  }
  return intersection;
}

function getGroupSpecialties(group: Pokemon[]): string[] {
  return [...new Set(group.flatMap((p) => p.specialties))].sort();
}

/** Four+ members: one row × four columns from `md` (900px) up; `sm` is 2×2, `xs` single column. */
function groupMembersGridSx(memberCount: number): SxProps<Theme> {
  const base: SxProps<Theme> = {
    display: "grid",
    width: "100%",
    minWidth: 0,
  };

  if (memberCount <= 1) {
    return { ...base, gridTemplateColumns: "minmax(0, 1fr)" };
  }

  if (memberCount === 2) {
    return {
      ...base,
      gridTemplateColumns: {
        xs: "minmax(0, 1fr)",
        sm: "repeat(2, minmax(0, 1fr))",
      },
    };
  }

  if (memberCount === 3) {
    return {
      ...base,
      gridTemplateColumns: {
        xs: "minmax(0, 1fr)",
        sm: "repeat(2, minmax(0, 1fr))",
        md: "repeat(3, minmax(0, 1fr))",
      },
    };
  }

  return {
    ...base,
    gridTemplateColumns: {
      xs: "minmax(0, 1fr)",
      sm: "repeat(2, minmax(0, 1fr))",
      md: "repeat(4, minmax(0, 1fr))",
    },
  };
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
  const isDark = theme.palette.mode === "dark";
  const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);
  const colors = habitatColors[habitat];
  /** In dark mode, neutral `divider` between member cards fights warm/cool habitat headers; tint with group chrome. */
  const memberDividerColor = isDark
    ? alpha(colors.border, 0.38)
    : theme.palette.divider;

  const {
    favCounts,
    score,
    scoreCap,
    scorePercent,
    habitats,
    conflicts,
    specialties,
  } = useMemo(() => {
    const allFavs = group.flatMap((p) => p.favorites);
    const counts = allFavs.reduce<Record<string, number>>((acc, f) => {
      acc[f] = (acc[f] ?? 0) + 1;
      return acc;
    }, {});
    const rawScore = groupScore(group);
    const cap = groupScoreUpperBound(group);
    return {
      favCounts: counts,
      score: rawScore,
      scoreCap: cap,
      scorePercent: cap > 0 ? Math.round((100 * rawScore) / cap) : 0,
      habitats: getGroupHabitats(group),
      conflicts: getGroupConflicts(group),
      specialties: getGroupSpecialties(group),
    };
  }, [group]);

  const universalFavorites = useMemo(
    () => favoritesEveryoneLikes(group),
    [group],
  );

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
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle2" fontWeight={700} color={colors.text}>
            Group {groupNumber}
          </Typography>

          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {specialties.map((s) => (
              <SpecialtyChip
                key={`group-spec-${s}`}
                label={s}
                surface="onTint"
                tint={{ text: colors.text, border: colors.border }}
                density="compact"
              />
            ))}
          </Stack>
        </Stack>

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
            label={
              scoreCap > 0
                ? `Score ${score}/${scoreCap} · ${scorePercent}%`
                : `Score ${score}`
            }
            title={
              scoreCap > 0
                ? "Total shared favorites summed over every pair in this group."
                : "Favorite overlap (no pairs or empty lists)"
            }
            size="small"
            sx={{
              bgcolor: colors.border,
              color: "common.white",
              fontSize: 11,
              height: 22,
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
      <Divider sx={{ borderColor: memberDividerColor }} />

      <Box sx={groupMembersGridSx(group.length)}>
        {group.map((pokemon, pi) => (
          <Box
            key={pokemon.id}
            sx={{
              minWidth: 0,
              borderRight:
                pi < group.length - 1
                  ? `1px solid ${memberDividerColor}`
                  : "none",
            }}
          >
            <PokemonCard
              pokemon={pokemon}
              onRemove={onRemovePokemon}
              favoriteCounts={favCounts}
              universalFavorites={universalFavorites}
              sx={{
                border: "none",
                borderRadius: 0,
                bgcolor: "transparent",
                "&:hover": {
                  boxShadow: "none",
                  transform: "none",
                },
              }}
            />
          </Box>
        ))}
      </Box>
      {footerContent && (
        <>
          <Divider sx={{ borderColor: memberDividerColor }} />
          <Box sx={{ px: 1.5, py: 1.25, bgcolor: "action.hover" }}>
            {footerContent}
          </Box>
        </>
      )}
    </Paper>
  );
}

export function HabitatChip({
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
