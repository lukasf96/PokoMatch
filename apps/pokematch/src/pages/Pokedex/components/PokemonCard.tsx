import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { memo } from "react";
import { habitatColors, habitatIcons } from "../../../services/habitatColors";
import type { Habitat, Pokemon } from "../../../types/types";

interface PokemonCardProps {
  pokemon: Pokemon;
  interactive: boolean;
  onToggle: (id: string) => void;
  showEventBadge: boolean;
  unlocked: boolean;
}

export const PokemonCard = memo(function PokemonCard({
  pokemon,
  interactive,
  onToggle,
  showEventBadge,
  unlocked,
}: PokemonCardProps) {
  const colors = habitatColors[pokemon.idealHabitat as Habitat];
  const HabitatIcon = habitatIcons[pokemon.idealHabitat as Habitat];
  const isEvent = pokemon.id.startsWith("e");
  const isNotHabitable = pokemon.isHabitable === false;

  return (
    <Paper
      variant="outlined"
      onClick={interactive ? () => onToggle(pokemon.id) : undefined}
      sx={{
        borderRadius: 1.5,
        overflow: "hidden",
        cursor: interactive ? "pointer" : "default",
        opacity: unlocked ? 1 : 0.45,
        borderColor: unlocked ? colors.border : "divider",
        transition: "opacity 0.15s, border-color 0.15s, box-shadow 0.15s",
        "&:hover": interactive
          ? {
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              opacity: unlocked ? 1 : 0.65,
            }
          : undefined,
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          bgcolor: unlocked ? colors.bg : "grey.100",
          px: 1.5,
          py: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background-color 0.15s",
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" minWidth={0}>
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ fontSize: 11, flexShrink: 0 }}
          >
            #{pokemon.dexNumber}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            color={unlocked ? colors.text : "text.secondary"}
          >
            {pokemon.name}
          </Typography>
          {showEventBadge && isEvent && (
            <Chip
              label="Event"
              size="small"
              sx={{
                height: 14,
                fontSize: 9,
                bgcolor: "secondary.light",
                color: "secondary.dark",
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
        {interactive &&
          (unlocked ? (
            <CheckBoxIcon sx={{ fontSize: 18, color: colors.text, flexShrink: 0 }} />
          ) : (
            <CheckBoxOutlineBlankIcon
              sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }}
            />
          ))}
      </Box>

      <Divider />

      <Box sx={{ px: 1.5, py: 0.75 }}>
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          useFlexGap
          mb={0.5}
          sx={{ flexWrap: "wrap" }}
        >
          <HabitatIcon sx={{ fontSize: 12, color: "text.secondary" }} />
          <Typography variant="body2" sx={{ fontSize: 11 }} color="text.secondary">
            {pokemon.idealHabitat}
          </Typography>
          {pokemon.favoriteFlavor && (
            <>
              <Typography variant="body2" sx={{ fontSize: 11 }} color="text.secondary">
                •
              </Typography>
              <RestaurantIcon sx={{ fontSize: 12, color: "text.secondary" }} />
              <Typography variant="body2" sx={{ fontSize: 11 }} color="text.secondary">
                {pokemon.favoriteFlavor}
              </Typography>
            </>
          )}
          {isNotHabitable && (
            <Chip
              label="Not habitable"
              size="small"
              sx={{
                height: 14,
                fontSize: 9,
                bgcolor: "warning.light",
                color: "warning.dark",
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
          {pokemon.favorites.map((fav) => (
            <Chip
              key={fav}
              label={fav}
              size="small"
              sx={{ height: 16, fontSize: 9, bgcolor: "grey.100" }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
});
