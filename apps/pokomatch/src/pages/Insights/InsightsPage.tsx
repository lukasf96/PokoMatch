import { Box, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { allPokemon, isEventDexPokemon } from "../../services/pokemon";
import type { Habitat, Pokemon } from "../../types/types";
import { DistributionSection } from "./components/DistributionSection";
import { IdealHabitats } from "./components/IdealHabitats";

function getDexSortValue(dexNumber: string): number {
  const matchedNumber = dexNumber.match(/\d+/);
  return matchedNumber ? Number(matchedNumber[0]) : Number.MAX_SAFE_INTEGER;
}

function sortByDexOrder(a: Pokemon, b: Pokemon): number {
  const aEvent = isEventDexPokemon(a);
  const bEvent = isEventDexPokemon(b);
  if (aEvent !== bEvent) return aEvent ? 1 : -1;

  const dexDiff = getDexSortValue(a.dexNumber) - getDexSortValue(b.dexNumber);
  if (dexDiff !== 0) return dexDiff;
  return a.name.localeCompare(b.name);
}

function StatCard({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: "100%",
      }}
    >
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
          {value}
        </Typography>
        {subvalue ? (
          <Typography variant="body2" color="text.secondary">
            {subvalue}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

export default function InsightsPage() {
  const habitats = useMemo(() => {
    const habitatMap = allPokemon.reduce<Record<string, Pokemon[]>>(
      (acc, pokemon) => {
        (acc[pokemon.idealHabitat] ??= []).push(pokemon);
        return acc;
      },
      {},
    );
    return Object.entries(habitatMap).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const favorites = useMemo(() => {
    const favoriteMap = allPokemon.reduce<Record<string, Pokemon[]>>(
      (acc, pokemon) => {
        for (const favorite of pokemon.favorites)
          (acc[favorite] ??= []).push(pokemon);
        return acc;
      },
      {},
    );
    return Object.entries(favoriteMap)
      .sort((a, b) => b[1].length - a[1].length)
      .map(
        ([favorite, members]) =>
          [favorite, members.slice().sort(sortByDexOrder)] as const,
      );
  }, []);

  const flavors = useMemo(() => {
    const flavorMap = allPokemon.reduce<Record<string, Pokemon[]>>(
      (acc, pokemon) => {
        if (!pokemon.favoriteFlavor) return acc;
        (acc[pokemon.favoriteFlavor] ??= []).push(pokemon);
        return acc;
      },
      {},
    );
    return Object.entries(flavorMap)
      .sort((a, b) => b[1].length - a[1].length)
      .map(
        ([flavor, members]) =>
          [flavor, members.slice().sort(sortByDexOrder)] as const,
      );
  }, []);

  const dexKindCounts = useMemo(() => {
    const standardCount = allPokemon.reduce(
      (count, pokemon) => count + (pokemon.dexKind === "standard" ? 1 : 0),
      0,
    );
    const eventCount = allPokemon.reduce(
      (count, pokemon) => count + (pokemon.dexKind === "event" ? 1 : 0),
      0,
    );
    return { standardCount, eventCount };
  }, []);

  const uniqueFavoritesCount = useMemo(() => {
    const unique = new Set<string>();
    for (const pokemon of allPokemon) {
      for (const favorite of pokemon.favorites) unique.add(favorite);
      // Treat "favoriteFlavor" as a taste/favorite too.
      if (pokemon.favoriteFlavor) unique.add(pokemon.favoriteFlavor);
    }
    return unique.size;
  }, []);

  const uniqueSpecialitiesCount = useMemo(() => {
    const unique = new Set<string>();
    for (const pokemon of allPokemon) {
      for (const specialty of pokemon.specialties) unique.add(specialty);
    }
    return unique.size;
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          component="h1"
          variant="h6"
          sx={{
            fontWeight: 950,
            lineHeight: 1.1,
            mb: 1,
          }}
        >
          Pokopia Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          A quick look at the dataset behind Pokomatch: habitats, favorites and
          more.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              label="Total Pokémon"
              value={`${allPokemon.length}`}
              subvalue={`Standard: ${dexKindCounts.standardCount} • Event: ${dexKindCounts.eventCount}`}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              label="Unique favorites"
              value={`${uniqueFavoritesCount}`}
              subvalue="Favorites including flavors"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              label="Unique Specialities"
              value={`${uniqueSpecialitiesCount}`}
              subvalue="Distinct specialties"
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <IdealHabitats
            habitats={habitats as ReadonlyArray<readonly [Habitat, Pokemon[]]>}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DistributionSection
            title="Favorites Distribution"
            items={favorites}
            totalPokemon={allPokemon.length}
            maxVisibleItems={10}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DistributionSection
            title="Favorite Flavor Distribution"
            items={flavors}
            totalPokemon={allPokemon.length}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
