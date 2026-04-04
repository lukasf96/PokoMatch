import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { Box, Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useMemo } from "react";
import { PokemonSpriteAvatar } from "../../../components/PokemonSpriteAvatar";
import { SpecialtyChip } from "../../../components/SpecialtyChip";
import {
  getHabitatColors,
  habitatIcons,
} from "../../../services/habitatColors";
import type { SuggestedPokemon } from "../../../services/matching.service";
import {
  getPokemonDisplayName,
  type PokemonNameLanguage,
} from "../../../services/pokemon-localization";
import { formatDexSegment } from "../group-helpers";

interface SuggestedNextPokemonControlsProps {
  suggestions: SuggestedPokemon[];
  nameLanguage: PokemonNameLanguage;
  onPick: (pokemonId: string) => void;
}

export const SuggestedNextPokemonControls = memo(
  function SuggestedNextPokemonControls({
    suggestions,
    nameLanguage,
    onPick,
  }: SuggestedNextPokemonControlsProps) {
    const theme = useTheme();
    const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);

    if (suggestions.length === 0) return null;

    return (
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LightbulbOutlinedIcon
            sx={{ fontSize: 16, color: "primary.main" }}
            aria-hidden
          />
          <Typography
            variant="caption"
            component="span"
            sx={{
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Suggested next
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {suggestions.map((suggestion) => {
            const { pokemon, score } = suggestion;
            const displayName = getPokemonDisplayName(pokemon, nameLanguage);
            const dexLabel = `#${formatDexSegment(pokemon.dexNumber)}`;
            const titleText = `${dexLabel} ${displayName}`;
            const hc = habitatColors[pokemon.idealHabitat];
            const HabitatIcon = habitatIcons[pokemon.idealHabitat];

            return (
              <Button
                key={pokemon.id}
                type="button"
                variant="outlined"
                onClick={() => onPick(pokemon.id)}
                aria-label={`Add ${displayName} to group, ${score} shared favorite overlap`}
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 1.25,
                  py: 1,
                  px: 1.25,
                  borderRadius: 1,
                  textAlign: "left",
                  textTransform: "none",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  transition: theme.transitions.create(
                    ["border-color", "background-color", "box-shadow"],
                    { duration: theme.transitions.duration.shortest },
                  ),
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.45),
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.12)}`,
                  },
                }}
              >
                <PokemonSpriteAvatar
                  pokemon={pokemon}
                  size={40}
                  padding={0.5}
                />
                <Stack
                  spacing={0.5}
                  flex={1}
                  minWidth={0}
                  alignItems="flex-start"
                >
                  <Typography
                    variant="body2"
                    lineHeight={1.25}
                    noWrap
                    title={titleText}
                    sx={{ width: "100%" }}
                  >
                    <Box
                      component="span"
                      sx={{ color: "text.secondary", fontWeight: 600 }}
                    >
                      {dexLabel}
                    </Box>
                    <Box
                      component="span"
                      sx={{ color: "text.primary", fontWeight: 800 }}
                    >
                      {" "}
                      {displayName}
                    </Box>
                  </Typography>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    useFlexGap
                    gap={0.5}
                    alignItems="center"
                  >
                    <Chip
                      icon={
                        <HabitatIcon sx={{ fontSize: "14px !important" }} />
                      }
                      label={pokemon.idealHabitat}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        bgcolor: alpha(
                          hc.bg,
                          theme.palette.mode === "dark" ? 0.35 : 0.65,
                        ),
                        color: hc.text,
                        borderColor: alpha(hc.border, 0.65),
                        "& .MuiChip-icon": {
                          color: hc.text,
                          ml: 0.35,
                        },
                      }}
                    />
                    {pokemon.specialties.map((specialty) => (
                      <SpecialtyChip key={specialty} label={specialty} />
                    ))}
                    <Chip
                      label={`+${score} Score`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        bgcolor: "action.selected",
                        color: "text.secondary",
                      }}
                    />
                  </Stack>
                </Stack>
              </Button>
            );
          })}
        </Box>
      </Box>
    );
  },
);
