import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { habitatColors, habitatEmoji } from "../../../services/habitatColors";
import type { Habitat, Pokemon } from "../../../types/types";

interface Props {
  pokemon: Pokemon[];
}

const isEvent = (p: Pokemon) => p.id.startsWith("e");

export default function OverviewTab({ pokemon }: Props) {
  // Habitat counts
  const habitatMap = pokemon.reduce<Record<string, Pokemon[]>>((acc, p) => {
    (acc[p.idealHabitat] ??= []).push(p);
    return acc;
  }, {});
  const habitats = Object.entries(habitatMap).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  // Favorite counts
  const favMap = pokemon.reduce<Record<string, Pokemon[]>>((acc, p) => {
    for (const fav of p.favorites) {
      (acc[fav] ??= []).push(p);
    }
    return acc;
  }, {});
  const favorites = Object.entries(favMap).sort(
    (a, b) => b[1].length - a[1].length,
  );

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Habitats */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Ideal Habitats
          </Typography>
          <Stack spacing={1}>
            {habitats.map(([habitat, members]) => (
              <HabitatRow
                key={habitat}
                habitat={habitat as Habitat}
                pokemon={members}
              />
            ))}
          </Stack>
        </Grid>

        {/* Favorites */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Favorite Preferences
          </Typography>
          <Stack spacing={0.75}>
            {favorites.map(([fav, members]) => (
              <FavoriteRow
                key={fav}
                favorite={fav}
                pokemon={members}
                totalPokemon={pokemon.length}
              />
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

function HabitatRow({
  habitat,
  pokemon,
}: {
  habitat: Habitat;
  pokemon: Pokemon[];
}) {
  const [open, setOpen] = useState(false);
  const colors = habitatColors[habitat];

  return (
    <Paper
      variant="outlined"
      sx={{ borderColor: colors.border, borderRadius: 1.5, overflow: "hidden" }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
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
          <Typography sx={{ fontSize: 18 }}>{habitatEmoji[habitat]}</Typography>
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
          {pokemon.map((p) => (
            <Chip
              key={p.id}
              label={`#${p.dexNumber} ${p.name}${isEvent(p) ? " ★" : ""}`}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                bgcolor: isEvent(p) ? "secondary.light" : undefined,
                color: isEvent(p) ? "secondary.dark" : undefined,
              }}
            />
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}

function FavoriteRow({
  favorite,
  pokemon,
  totalPokemon,
}: {
  favorite: string;
  pokemon: Pokemon[];
  totalPokemon: number;
}) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((pokemon.length / totalPokemon) * 100);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{ cursor: "pointer", userSelect: "none" }}
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
            {favorite}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 6,
                borderRadius: 3,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${pct}%`,
                  height: "100%",
                  bgcolor: "secondary.main",
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
          {pokemon
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
              <Chip
                key={p.id}
                label={`#${p.dexNumber} ${p.name}${isEvent(p) ? " ★" : ""}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  bgcolor: isEvent(p) ? "secondary.light" : undefined,
                  color: isEvent(p) ? "secondary.dark" : undefined,
                }}
              />
            ))}
        </Box>
      </Collapse>
    </Paper>
  );
}

function ExpandIcon({ open, color }: { open: boolean; color: string }) {
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
