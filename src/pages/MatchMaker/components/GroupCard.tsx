import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useTheme,
  type SelectChangeEvent,
  type SxProps,
  type Theme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
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
import {
  POKOPIA_LOCATIONS,
  type Habitat,
  type Pokemon,
  type PokopiaLocation,
} from "../../../types/types";

interface GroupCardProps {
  group: Pokemon[];
  groupNumber: number;
  habitat: Habitat;
  /** Hides the numbered label for read-only embeds such as share images. */
  showGroupName?: boolean;
  onRemovePokemon?: (pokemonId: string) => void;
  footerContent?: ReactNode;
  groupAction?: {
    ariaLabel: string;
    onClick: () => void;
    kind: "add" | "remove";
  };
  /** Secondary header actions appear immediately before the primary group action. */
  groupActions?: Array<{
    ariaLabel: string;
    onClick: () => void;
    kind: "share";
    disabled?: boolean;
  }>;
  /** Optional Pokopia location for this group. */
  location?: PokopiaLocation;
  onLocationChange?: (location: PokopiaLocation | undefined) => void;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
  style?: CSSProperties;
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

/** Stable sx for member cards so memoized `PokemonCard`s aren't re-rendered when
 * only the enclosing group re-renders (e.g. a group-number label change). */
const MEMBER_CARD_SX: SxProps<Theme> = {
  border: "none",
  borderRadius: 0,
  bgcolor: "transparent",
  "&:hover": {
    boxShadow: "none",
    transform: "none",
  },
};

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
  showGroupName = true,
  onRemovePokemon,
  footerContent,
  groupAction,
  groupActions,
  location,
  onLocationChange,
  dragHandleAttributes,
  dragHandleListeners,
  isDragging = false,
  style,
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

  const hasHabitatConflict = conflicts.length > 0;
  const locationSelectId = `group-${groupNumber}-location`;

  return (
    <Paper
      variant="outlined"
      style={style}
      sx={{
        borderColor: hasHabitatConflict
          ? theme.palette.error.main
          : colors.border,
        borderWidth: hasHabitatConflict ? 2 : 1,
        borderRadius: 2,
        overflow: "hidden",
        opacity: isDragging ? 0.88 : 1,
        boxShadow: isDragging ? theme.shadows[6] : undefined,
        transition: theme.transitions.create(["box-shadow", "border-color"], {
          duration: theme.transitions.duration.shortest,
        }),
        "&:hover": {
          boxShadow: theme.shadows[isDragging ? 6 : 2],
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
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
          }}
        >
          {dragHandleAttributes ? (
            <IconButton
              size="small"
              aria-label={`Drag to reorder group ${groupNumber}`}
              {...dragHandleAttributes}
              {...dragHandleListeners}
              sx={{
                cursor: "grab",
                color: colors.text,
                touchAction: "none",
                "&:active": { cursor: "grabbing" },
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          ) : null}
          {showGroupName ? (
            <Typography
              variant="subtitle2"
              color={colors.text}
              sx={{
                fontWeight: 700,
              }}
            >
              Group {groupNumber}
            </Typography>
          ) : null}

          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            sx={{
              flexWrap: "wrap",
            }}
          >
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
          useFlexGap
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {onLocationChange ? (
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 168 },
                maxWidth: { xs: "100%", sm: 220 },
              }}
            >
              <Select
                id={locationSelectId}
                value={location ?? ""}
                displayEmpty
                aria-label={`Location for group ${groupNumber}`}
                onChange={(event: SelectChangeEvent<string>) => {
                  const value = event.target.value;
                  onLocationChange(
                    value === "" ? undefined : (value as PokopiaLocation),
                  );
                }}
                sx={{
                  bgcolor: "background.paper",
                  height: 22,
                  fontSize: 11,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderRadius: "16px",
                  },
                  "& .MuiOutlinedInput-input": {
                    py: 0,
                    px: 1,
                    pr: "28px !important",
                    display: "flex",
                    alignItems: "center",
                    minHeight: "unset",
                    height: 22,
                    boxSizing: "border-box",
                  },
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    py: 0,
                  },
                  "& .MuiSelect-icon": {
                    right: 2,
                    fontSize: 16,
                  },
                }}
                renderValue={(selected) =>
                  selected ? (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: "center", minWidth: 0 }}
                    >
                      <PlaceOutlinedIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        component="span"
                        noWrap
                        sx={{ fontSize: 11, lineHeight: 1 }}
                      >
                        {selected}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: "text.secondary",
                        fontSize: 11,
                        lineHeight: 1,
                      }}
                    >
                      No location set
                    </Typography>
                  )
                }
              >
                <MenuItem value="">
                  <em>No location set</em>
                </MenuItem>
                {POKOPIA_LOCATIONS.map((pokopiaLocation) => (
                  <MenuItem key={pokopiaLocation} value={pokopiaLocation}>
                    {pokopiaLocation}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : location ? (
            <Chip
              icon={<PlaceOutlinedIcon />}
              label={location}
              size="small"
              variant="outlined"
              sx={{
                height: 22,
                fontSize: 11,
                bgcolor: "background.paper",
                color: colors.text,
                borderColor: colors.border,
                "& .MuiChip-icon": {
                  color: colors.text,
                  ml: 0.5,
                  fontSize: 14,
                },
              }}
            />
          ) : null}
          {habitats.map((groupHabitat) => (
            <HabitatChip
              key={`habitat-${groupHabitat}`}
              habitat={groupHabitat}
              variant="group"
            />
          ))}
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
          {groupActions?.map((action) => (
            <IconButton
              key={action.ariaLabel}
              size="small"
              aria-label={action.ariaLabel}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <ShareOutlinedIcon fontSize="small" />
            </IconButton>
          ))}
          {groupAction && (
            <IconButton
              size="small"
              aria-label={groupAction.ariaLabel}
              onClick={groupAction.onClick}
            >
              {groupAction.kind === "add" ? (
                <AddIcon fontSize="small" />
              ) : (
                <DeleteOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </Stack>
      </Box>
      {hasHabitatConflict ? (
        <Alert
          severity="error"
          variant="outlined"
          icon={<ReportProblemOutlinedIcon fontSize="inherit" />}
          sx={{
            borderRadius: 0,
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            py: 1.25,
            px: 2,
            alignItems: "flex-start",
            bgcolor: alpha(theme.palette.error.main, isDark ? 0.14 : 0.08),
            "& .MuiAlert-icon": {
              color: "error.main",
              mt: 0.15,
            },
            "& .MuiAlert-message": { width: "100%", pt: 0 },
          }}
        >
          <AlertTitle sx={{ fontWeight: 800, mb: 0.25, fontSize: "0.95rem" }}>
            Habitat conflict
          </AlertTitle>
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              mb: 0.5,
            }}
          >
            Opposite habitat needs are mixed in this group. Someone will not be
            happy here.
          </Typography>
          <Stack
            direction="row"
            useFlexGap
            sx={{
              flexWrap: "wrap",
              gap: 0.75,
            }}
          >
            {conflicts.map(([left, right]) => (
              <Chip
                key={`${left}-${right}`}
                label={`${left} ↔ ${right}`}
                size="small"
                color="error"
                variant="filled"
                sx={{ fontWeight: 700, fontSize: 11, height: 22 }}
              />
            ))}
          </Stack>
        </Alert>
      ) : null}
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
              sx={MEMBER_CARD_SX}
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
        height: isGroup ? 22 : 18,
        fontSize: isGroup ? 11 : 10,
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
