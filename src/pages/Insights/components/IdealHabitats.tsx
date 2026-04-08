import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo } from "react";
import {
  getHabitatColors,
  habitatIcons,
} from "../../../services/habitatColors";
import type { Habitat, Pokemon } from "../../../types/types";
import { PokemonChip } from "./PokemonChip";

interface IdealHabitatsProps {
  habitats: ReadonlyArray<readonly [Habitat, Pokemon[]]>;
}

interface HabitatRowProps {
  habitat: Habitat;
  pokemon: Pokemon[];
}

function HabitatRow({ habitat, pokemon }: HabitatRowProps) {
  const theme = useTheme();
  const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);
  const colors = habitatColors[habitat];
  const HabitatIcon = habitatIcons[habitat];

  return (
    <Accordion
      elevation={0}
      sx={{
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon
            sx={{ fontSize: 18, color: colors.text }}
            aria-hidden
          />
        }
        sx={{
          bgcolor: colors.bg,
          minHeight: 0,
          px: 1.5,
          py: 1,
          "&.Mui-expanded": { minHeight: 0 },
          "& .MuiAccordionSummary-content": {
            margin: 0,
            alignItems: "center",
          },
          "& .MuiAccordionSummary-content.Mui-expanded": { margin: 0 },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", pr: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
            <HabitatIcon sx={{ fontSize: 18, color: colors.text }} />
            <Typography
              variant="body2"
              fontWeight={600}
              color={colors.text}
              noWrap
            >
              {habitat}
            </Typography>
          </Stack>
          <Chip
            label={pokemon.length}
            size="small"
            sx={{
              bgcolor: colors.border,
              color: "white",
              height: 20,
              fontSize: 11,
              flexShrink: 0,
            }}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Divider />
        <Box
          sx={{ px: 1.5, py: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}
        >
          {pokemon.map((member) => (
            <PokemonChip key={member.id} pokemon={member} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export function IdealHabitats({ habitats }: IdealHabitatsProps) {
  return (
    <>
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
        Ideal Habitats
      </Typography>
      <Stack spacing={1}>
        {habitats.map(([habitat, pokemon]) => (
          <HabitatRow key={habitat} habitat={habitat} pokemon={pokemon} />
        ))}
      </Stack>
    </>
  );
}
