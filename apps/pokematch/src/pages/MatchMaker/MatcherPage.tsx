import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { Container, Stack, Typography } from "@mui/material";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  computeAutoGroups,
  type SuggestedPokemon,
  suggestNextPokemon,
} from "../../services/matching.service";
import { habitablePokemon } from "../../services/pokemon";
import { useStore } from "../../store/store";
import type { Pokemon } from "../../types/types";
import { AutoGroupsSection } from "./components/AutoGroupsSection";
import { CustomGroupsSection } from "./components/CustomGroupsSection";

function groupKeyFromPokemon(group: Pokemon[]): string {
  return group
    .map((pokemon) => pokemon.id)
    .sort()
    .join("|");
}

export default function MatcherPage() {
  const unlockedIds = useStore((s) => s.unlockedIds);
  const customGroups = useStore((s) => s.customGroups);
  const addCustomGroup = useStore((s) => s.addCustomGroup);
  const addSuggestedGroupToCustomGroups = useStore(
    (s) => s.addSuggestedGroupToCustomGroups,
  );
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
  const deferredAutoPokemon = useDeferredValue(autoPokemon);
  const autoGroups = useMemo(
    () => computeAutoGroups(deferredAutoPokemon),
    [deferredAutoPokemon],
  );
  const [frozenSuggestedGroups, setFrozenSuggestedGroups] = useState<
    Pokemon[][] | null
  >(null);
  const [adoptedSuggestedGroupKeys, setAdoptedSuggestedGroupKeys] = useState<
    Set<string>
  >(() => new Set());

  const availablePokemon = useMemo(
    () => activePokemon.filter((p) => !customAssignedIds.has(p.id)),
    [activePokemon, customAssignedIds],
  );

  const suggestions = useMemo<SuggestedPokemon[][]>(
    () =>
      resolvedCustomGroups.map((group) =>
        suggestNextPokemon(
          group,
          availablePokemon.filter(
            (candidate) => !group.some((member) => member.id === candidate.id),
          ),
        ),
      ),
    [resolvedCustomGroups, availablePokemon],
  );

  const resetSuggestedFreeze = useCallback(() => {
    setFrozenSuggestedGroups(null);
    setAdoptedSuggestedGroupKeys(new Set());
  }, []);

  const displayedSuggestedGroups = useMemo(() => {
    if (!frozenSuggestedGroups) return autoGroups;
    return frozenSuggestedGroups.filter(
      (group) => !adoptedSuggestedGroupKeys.has(groupKeyFromPokemon(group)),
    );
  }, [autoGroups, frozenSuggestedGroups, adoptedSuggestedGroupKeys]);

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
            Match-Maker
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth="sm">
            Suggested groups maximize shared favorite activities while
            respecting ideal habitats.
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          <CustomGroupsSection
            customGroups={resolvedCustomGroups}
            suggestions={suggestions}
            availablePokemon={availablePokemon}
            onAddGroup={() => {
              resetSuggestedFreeze();
              addCustomGroup();
            }}
            onDeleteGroup={(groupIndex) => {
              resetSuggestedFreeze();
              deleteCustomGroup(groupIndex);
            }}
            onAddPokemon={(groupIndex, pokemonId) => {
              resetSuggestedFreeze();
              addPokemonToCustomGroup(groupIndex, pokemonId);
            }}
            onRemovePokemon={(groupIndex, pokemonId) => {
              resetSuggestedFreeze();
              removePokemonFromCustomGroup(groupIndex, pokemonId);
            }}
          />

          <AutoGroupsSection
            groups={displayedSuggestedGroups}
            onQuickAddGroup={(group) => {
              if (!frozenSuggestedGroups) {
                setFrozenSuggestedGroups(autoGroups);
              }
              setAdoptedSuggestedGroupKeys((prev) => {
                const next = new Set(prev);
                next.add(groupKeyFromPokemon(group));
                return next;
              });
              addSuggestedGroupToCustomGroups(
                group.map((pokemon) => pokemon.id),
              );
            }}
          />
        </Stack>
      </Stack>
    </Container>
  );
}
