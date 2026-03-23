import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import type { Pokemon } from "../../../types/types";
import { PokemonChip } from "./PokemonChip";

interface DistributionSectionProps {
  title: string;
  items: ReadonlyArray<readonly [string, Pokemon[]]>;
  totalPokemon: number;
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

interface DistributionRowProps {
  label: string;
  pokemon: Pokemon[];
  totalPokemon: number;
}

function DistributionRow({ label, pokemon, totalPokemon }: DistributionRowProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const percentage = Math.round((pokemon.length / totalPokemon) * 100);
  const isDark = theme.palette.mode === "dark";
  const progressTrackColor = isDark
    ? alpha(theme.palette.common.white, 0.12)
    : theme.palette.action.hover;
  const progressFillColor = isDark
    ? theme.palette.primary.light
    : theme.palette.primary.main;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box
        onClick={() => setOpen((isOpen) => !isOpen)}
        sx={{
          cursor: "pointer",
          userSelect: "none",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 0.75,
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap>
            {label}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 6,
                borderRadius: 3,
                bgcolor: progressTrackColor,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${percentage}%`,
                  height: "100%",
                  bgcolor: progressFillColor,
                  borderRadius: 3,
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 12, minWidth: 24, textAlign: "right" }}
            >
              {pokemon.length}
            </Typography>
            <ExpandIcon open={open} color="text.secondary" />
          </Stack>
        </Box>
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

export function DistributionSection({
  title,
  items,
  totalPokemon,
}: DistributionSectionProps) {
  return (
    <>
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
        {title}
      </Typography>
      <Stack spacing={0.75}>
        {items.map(([label, pokemon]) => (
          <DistributionRow
            key={label}
            label={label}
            pokemon={pokemon}
            totalPokemon={totalPokemon}
          />
        ))}
      </Stack>
    </>
  );
}
