import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { Container, Stack, Typography } from "@mui/material";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { suggestItemsForGroup } from "../../services/items";
import {
  computeAutoGroups,
  type SuggestedPokemon,
  suggestNextPokemon,
} from "../../services/matching.service";
import { habitablePokemon } from "../../services/pokemon";
import { useStore } from "../../store/store";
import type { Pokemon, SuggestedItem } from "../../types/types";
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
  const preferEvolutionLines = useStore(
    (s) => s.preferEvolutionLinesInMatching,
  );
  const setPreferEvolutionLines = useStore(
    (s) => s.setPreferEvolutionLinesInMatching,
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
    () =>
      computeAutoGroups(deferredAutoPokemon, {
        preferEvolutionLines,
      }),
    [deferredAutoPokemon, preferEvolutionLines],
  );
  const [frozenSuggestedGroups, setFrozenSuggestedGroups] = useState<
    Pokemon[][] | null
  >(null);
  /** Preference value when `frozenSuggestedGroups` was captured; must match current pref for freeze to apply. */
  const [freezePreferEvolutionLines, setFreezePreferEvolutionLines] = useState<
    boolean | null
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
    setFreezePreferEvolutionLines(null);
    setAdoptedSuggestedGroupKeys(new Set());
  }, []);

  // Stable callbacks — defined once; passed to memoized children so their memo never busts
  const handleAddGroup = useCallback(() => {
    resetSuggestedFreeze();
    addCustomGroup();
  }, [resetSuggestedFreeze, addCustomGroup]);

  const handleDeleteGroup = useCallback(
    (groupIndex: number) => {
      resetSuggestedFreeze();
      deleteCustomGroup(groupIndex);
    },
    [resetSuggestedFreeze, deleteCustomGroup],
  );

  const handleAddPokemon = useCallback(
    (groupIndex: number, pokemonId: string) => {
      resetSuggestedFreeze();
      addPokemonToCustomGroup(groupIndex, pokemonId);
    },
    [resetSuggestedFreeze, addPokemonToCustomGroup],
  );

  const handleRemovePokemon = useCallback(
    (groupIndex: number, pokemonId: string) => {
      resetSuggestedFreeze();
      removePokemonFromCustomGroup(groupIndex, pokemonId);
    },
    [resetSuggestedFreeze, removePokemonFromCustomGroup],
  );

  const hasActiveSuggestedFreeze = useMemo(
    () =>
      frozenSuggestedGroups != null &&
      freezePreferEvolutionLines === preferEvolutionLines,
    [frozenSuggestedGroups, freezePreferEvolutionLines, preferEvolutionLines],
  );

  const handleQuickAddGroup = useCallback(
    (group: Pokemon[]) => {
      if (!hasActiveSuggestedFreeze) {
        setFrozenSuggestedGroups(autoGroups);
        setFreezePreferEvolutionLines(preferEvolutionLines);
      }
      setAdoptedSuggestedGroupKeys((prev) => {
        const base = !hasActiveSuggestedFreeze ? new Set<string>() : prev;
        const next = new Set(base);
        next.add(groupKeyFromPokemon(group));
        return next;
      });
      addSuggestedGroupToCustomGroups(group.map((pokemon) => pokemon.id));
    },
    [
      hasActiveSuggestedFreeze,
      autoGroups,
      preferEvolutionLines,
      addSuggestedGroupToCustomGroups,
    ],
  );

  const displayedSuggestedGroups = useMemo(() => {
    if (!hasActiveSuggestedFreeze || !frozenSuggestedGroups) return autoGroups;
    return frozenSuggestedGroups.filter(
      (group) => !adoptedSuggestedGroupKeys.has(groupKeyFromPokemon(group)),
    );
  }, [
    autoGroups,
    frozenSuggestedGroups,
    adoptedSuggestedGroupKeys,
    hasActiveSuggestedFreeze,
  ]);

  const customGroupItemSuggestions = useMemo<SuggestedItem[][]>(
    () => resolvedCustomGroups.map((group) => suggestItemsForGroup(group)),
    [resolvedCustomGroups],
  );

  const autoGroupItemSuggestions = useMemo<SuggestedItem[][]>(
    () => displayedSuggestedGroups.map((group) => suggestItemsForGroup(group)),
    [displayedSuggestedGroups],
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
      <Stack spacing={2}>
        <Typography
          component="h1"
          variant="h5"
          sx={{ fontWeight: 800, lineHeight: 1.2 }}
        >
          Pokopia Habitat Planner & Match‑Maker
        </Typography>
        <Stack spacing={1.5}>
          <CustomGroupsSection
            customGroups={resolvedCustomGroups}
            suggestions={suggestions}
            itemSuggestions={customGroupItemSuggestions}
            availablePokemon={availablePokemon}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            onAddPokemon={handleAddPokemon}
            onRemovePokemon={handleRemovePokemon}
          />

          <AutoGroupsSection
            groups={displayedSuggestedGroups}
            itemSuggestions={autoGroupItemSuggestions}
            preferEvolutionLines={preferEvolutionLines}
            onPreferEvolutionLinesChange={setPreferEvolutionLines}
            onQuickAddGroup={handleQuickAddGroup}
          />
        </Stack>
      </Stack>
    </Container>
  );
}
