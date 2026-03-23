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
import { useMemo, useState } from "react";
import { habitatColors, habitatIcons } from "../../../services/habitatColors";
import type { Habitat, Pokemon } from "../../../types/types";

interface Props {
  pokemon: Pokemon[];
}

const isEvent = (p: Pokemon) => p.id.startsWith("e");
const getDexSortValue = (dexNumber: string) => {
  const matchedNumber = dexNumber.match(/\d+/);
  return matchedNumber ? Number(matchedNumber[0]) : Number.MAX_SAFE_INTEGER;
};
const sortByDexOrder = (a: Pokemon, b: Pokemon) => {
  const aIsEvent = isEvent(a);
  const bIsEvent = isEvent(b);
  if (aIsEvent !== bIsEvent) return aIsEvent ? 1 : -1;

  const dexDiff = getDexSortValue(a.dexNumber) - getDexSortValue(b.dexNumber);
  if (dexDiff !== 0) return dexDiff;

  return a.name.localeCompare(b.name);
};

export default function OverviewTab({ pokemon }: Props) {
  // Habitat counts
  const habitats = useMemo(() => {
    const habitatMap = pokemon.reduce<Record<string, Pokemon[]>>((acc, p) => {
      (acc[p.idealHabitat] ??= []).push(p);
      return acc;
    }, {});
    return Object.entries(habitatMap).sort((a, b) => a[0].localeCompare(b[0]));
  }, [pokemon]);

  // Favorite counts
  const favorites = useMemo(() => {
    const favMap = pokemon.reduce<Record<string, Pokemon[]>>((acc, p) => {
      for (const fav of p.favorites) {
        (acc[fav] ??= []).push(p);
      }
      return acc;
    }, {});
    return Object.entries(favMap)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([fav, members]) => [fav, members.slice().sort(sortByDexOrder)] as const);
  }, [pokemon]);

  // Favorite flavor counts
  const flavors = useMemo(() => {
    const flavorMap = pokemon.reduce<Record<string, Pokemon[]>>((acc, p) => {
      if (!p.favoriteFlavor) return acc;
      (acc[p.favoriteFlavor] ??= []).push(p);
      return acc;
    }, {});
    return Object.entries(flavorMap)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([flavor, members]) => [flavor, members.slice().sort(sortByDexOrder)] as const);
  }, [pokemon]);

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
        <Grid size={{ xs: 12, md: 4 }}>
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

        {/* Flavor breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Flavor Breakdown
          </Typography>
          <Stack spacing={0.75}>
            {flavors.map(([flavor, members]) => (
              <FavoriteRow
                key={flavor}
                favorite={flavor}
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
  const HabitatIcon = habitatIcons[habitat];

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
