import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { getHabitatColors, habitatIcons } from "../../../services/habitatColors";
import type { Habitat, Pokemon } from "../../../types/types";
import { PokemonChip } from "./PokemonChip";

interface IdealHabitatsProps {
  habitats: ReadonlyArray<readonly [Habitat, Pokemon[]]>;
}

interface ExpandIconProps {
  open: boolean;
  color: string;
}

function ExpandIcon({ open, color }: ExpandIconProps) {
  return (
    <IconButton size="small" sx={{ p: 0, color }} tabIndex={-1}>
      <ExpandMoreIcon
        sx={{
          fontSize: 16,
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </IconButton>
  );
}

interface HabitatRowProps {
  habitat: Habitat;
  pokemon: Pokemon[];
}

function HabitatRow({ habitat, pokemon }: HabitatRowProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);
  const colors = habitatColors[habitat];
  const HabitatIcon = habitatIcons[habitat];

  return (
    <Paper
      variant="outlined"
      sx={{ borderColor: colors.border, borderRadius: 1.5, overflow: "hidden" }}
    >
      <Box
        onClick={() => setOpen((isOpen) => !isOpen)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          bgcolor: colors.bg,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <HabitatIcon sx={{ fontSize: 18, color: colors.text }} />
          <Typography variant="body2" fontWeight={600} color={colors.text}>
            {habitat}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={pokemon.length}
            size="small"
            sx={{
              bgcolor: colors.border,
              color: "white",
              height: 20,
              fontSize: 11,
            }}
          />
          <ExpandIcon open={open} color={colors.text} />
        </Stack>
      </Box>
      <Collapse in={open}>
        <Divider />
        <Box
          sx={{ px: 1.5, py: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}
        >
          {pokemon.map((member) => (
            <PokemonChip key={member.id} pokemon={member} />
          ))}
        </Box>
      </Collapse>
    </Paper>
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
