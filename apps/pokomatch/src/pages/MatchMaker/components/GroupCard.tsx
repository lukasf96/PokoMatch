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

function PokemonIdentity({
  pokemon,
  onRemovePokemon,
}: {
  pokemon: Pokemon;
  onRemovePokemon?: (pokemonId: string) => void;
}) {
  const nameLanguage = useStore((state) => state.nameLanguage);
  const pokemonDisplayName = getPokemonDisplayName(pokemon, nameLanguage);

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      mb={0.5}
      flexWrap="wrap"
      minWidth={0}
    >
      <PokemonSpriteAvatar pokemon={pokemon} />
      <Typography variant="caption" color="text.disabled" sx={{ minWidth: 32 }}>
        #{pokemon.dexNumber}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        noWrap
        sx={{ flex: "1 1 auto", minWidth: 0 }}
      >
        {pokemonDisplayName}
      </Typography>
      {isEventPokemon(pokemon) && (
        <Chip
          label="Event"
          size="small"
          sx={{
            height: 16,
            fontSize: 9,
            bgcolor: "secondary.light",
            color: "secondary.dark",
            ml: 0.5,
          }}
        />
      )}
      {onRemovePokemon && (
        <IconButton
          size="small"
          aria-label={`Remove ${pokemonDisplayName}`}
          onClick={() => onRemovePokemon(pokemon.id)}
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
              flex: "1 1 220px",
              p: 1.5,
              borderRight:
                pi < group.length - 1 ? `1px solid ${dividerColor}` : "none",
              minWidth: 0,
            }}
          >
            <PokemonIdentity pokemon={pokemon} onRemovePokemon={onRemovePokemon} />
            <Box sx={{ mb: 0.5 }}>
              <HabitatChip habitat={pokemon.idealHabitat} variant="pokemon" />
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {pokemon.favorites.map((fav) => {
                const isShared = (favCounts[fav] ?? 0) >= 2;
                return (
                  <Chip
                    key={fav}
                    label={fav}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      bgcolor: isShared ? colors.bg : "action.hover",
                      color: isShared ? colors.text : "text.secondary",
                      fontWeight: isShared ? 600 : 400,
                      border: isShared ? `1px solid ${colors.border}` : "none",
                    }}
                  />
                );
              })}
            </Box>
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
