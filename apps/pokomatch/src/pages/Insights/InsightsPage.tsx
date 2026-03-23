import { Box, Container, Grid } from "@mui/material";
import { useMemo } from "react";
import { allPokemon } from "../../services/pokemon";
import type { Habitat, Pokemon } from "../../types/types";
import { DistributionSection } from "./components/DistributionSection";
import { IdealHabitats } from "./components/IdealHabitats";

const isEvent = (pokemon: Pokemon) => pokemon.id.startsWith("e");

function getDexSortValue(dexNumber: string): number {
  const matchedNumber = dexNumber.match(/\d+/);
  return matchedNumber ? Number(matchedNumber[0]) : Number.MAX_SAFE_INTEGER;
}

function sortByDexOrder(a: Pokemon, b: Pokemon): number {
  const aIsEvent = isEvent(a);
  const bIsEvent = isEvent(b);
  if (aIsEvent !== bIsEvent) return aIsEvent ? 1 : -1;

  const dexDiff = getDexSortValue(a.dexNumber) - getDexSortValue(b.dexNumber);
  if (dexDiff !== 0) return dexDiff;
  return a.name.localeCompare(b.name);
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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <IdealHabitats
              habitats={
                habitats as ReadonlyArray<readonly [Habitat, Pokemon[]]>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DistributionSection
              title="Favorites Distribution"
              items={favorites}
              totalPokemon={allPokemon.length}
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
      </Box>
    </Container>
  );
}
