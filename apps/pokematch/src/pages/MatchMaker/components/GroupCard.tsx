import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { memo, useMemo } from "react";
import { PokemonSpriteAvatar } from "../../../components/pokemon-sprite-avatar/PokemonSpriteAvatar";
import {
  getGroupConflicts,
  getGroupHabitats,
} from "../../../services/habitat-conflicts";
import { habitatColors, habitatIcons } from "../../../services/habitatColors";
import { getPokemonDisplayName } from "../../../services/pokemon-localization";
import { groupScore } from "../../../services/matching.service";
import { useStore } from "../../../store/store";
import type { Habitat, Pokemon } from "../../../types/types";

interface GroupCardProps {
  group: Pokemon[];
  groupNumber: number;
  habitat: Habitat;
}

function isEventPokemon(p: Pokemon): boolean {
  return p.id.startsWith("e");
}

function PokemonIdentity({ pokemon }: { pokemon: Pokemon }) {
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
    </Stack>
  );
}

function GroupCardComponent({ group, groupNumber, habitat }: GroupCardProps) {
  const theme = useTheme();
  const colors = habitatColors[habitat];

  const { favCounts, sharedFavs, score, habitats, conflicts } = useMemo(() => {
    const allFavs = group.flatMap((p) => p.favorites);
    const counts = allFavs.reduce<Record<string, number>>((acc, f) => {
      acc[f] = (acc[f] ?? 0) + 1;
      return acc;
    }, {});
    const shared = Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);
    return {
      favCounts: counts,
      sharedFavs: shared,
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
          {sharedFavs.slice(0, 3).map(([fav, count]) => (
            <Chip
              key={fav}
              label={`${fav} ×${count}`}
              size="small"
              sx={{
                bgcolor: "background.paper",
                fontSize: 11,
                height: 20,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            />
          ))}
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
            <PokemonIdentity pokemon={pokemon} />
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
