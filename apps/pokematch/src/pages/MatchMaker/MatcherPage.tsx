import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { Container, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import {
  computeAutoGroups,
  suggestNextPokemon,
} from "../../services/matching.service";
import { habitablePokemon } from "../../services/pokemon";
import { useStore } from "../../store/store";
import type { Pokemon } from "../../types/types";
import { AutoGroupsSection } from "./components/AutoGroupsSection";
import { CustomGroupsSection } from "./components/CustomGroupsSection";

export default function MatcherPage() {
  const unlockedIds = useStore((s) => s.unlockedIds);
  const customGroups = useStore((s) => s.customGroups);
  const addCustomGroup = useStore((s) => s.addCustomGroup);
  const deleteCustomGroup = useStore((s) => s.deleteCustomGroup);
  const addPokemonToCustomGroup = useStore((s) => s.addPokemonToCustomGroup);
  const removePokemonFromCustomGroup = useStore(
    (s) => s.removePokemonFromCustomGroup,
  );

  const activePokemon = useMemo(() => {
    return habitablePokemon.filter((p) => unlockedIds.has(p.id));
  }, [unlockedIds]);

  const pokemonById = useMemo(
    () =>
      activePokemon.reduce<Record<string, Pokemon>>((acc, pokemon) => {
        acc[pokemon.id] = pokemon;
        return acc;
      }, {}),
    [activePokemon],
  );

  const resolvedCustomGroups = useMemo(
    () =>
      customGroups.map((group) =>
        group
          .map((id) => pokemonById[id])
          .filter((pokemon): pokemon is Pokemon => Boolean(pokemon)),
      ),
    [customGroups, pokemonById],
  );

  const customAssignedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of resolvedCustomGroups) {
      for (const pokemon of group) ids.add(pokemon.id);
    }
    return ids;
  }, [resolvedCustomGroups]);

  const autoPokemon = useMemo(
    () => activePokemon.filter((pokemon) => !customAssignedIds.has(pokemon.id)),
    [activePokemon, customAssignedIds],
  );
  const autoGroups = useMemo(
    () => computeAutoGroups(autoPokemon),
    [autoPokemon],
  );

  if (activePokemon.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <GroupsOutlinedIcon
          sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
          aria-hidden
        />
        <Typography color="text.secondary" mb={1}>
          No Pokémon available with current settings.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Go to Pokédex and unlock some Pokémon first.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6" component="h1" fontWeight={700}>
            Match groups
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth="sm">
            Auto groups maximize shared favorite activities while enforcing
            habitat conflicts (Bright/Dark, Humid/Dry, Warm/Cool).
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          <CustomGroupsSection
            customGroups={resolvedCustomGroups}
            suggestions={resolvedCustomGroups.map((group) =>
              suggestNextPokemon(
                group,
                activePokemon.filter(
                  (candidate) =>
                    !customAssignedIds.has(candidate.id) &&
                    !group.some((member) => member.id === candidate.id),
                ),
              ),
            )}
            availablePokemon={activePokemon.filter(
              (pokemon) => !customAssignedIds.has(pokemon.id),
            )}
            onAddGroup={addCustomGroup}
            onDeleteGroup={deleteCustomGroup}
            onAddPokemon={addPokemonToCustomGroup}
            onRemovePokemon={removePokemonFromCustomGroup}
          />

          <AutoGroupsSection groups={autoGroups} />
        </Stack>
      </Stack>
    </Container>
  );
}
