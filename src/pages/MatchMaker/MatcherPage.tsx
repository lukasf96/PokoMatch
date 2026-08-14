import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { Container, Stack, Typography } from "@mui/material";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppToast } from "../../components/AppToast";
import { ScrollToTopFab } from "../../components/ScrollToTopFab";
import { suggestItemsForGroup } from "../../services/items";
import {
  type SuggestedPokemon,
  suggestNextPokemon,
} from "../../services/matching.service";
import { habitablePokemon } from "../../services/pokemon";
import { useStore } from "../../store/store";
import type { Pokemon, PokopiaLocation, SuggestedItem } from "../../types/types";
import { AutoGroupsSection } from "./components/AutoGroupsSection";
import {
  CustomGroupsSection,
  type ResolvedCustomGroup,
} from "./components/CustomGroupsSection";
import { SharedGroupPreview } from "./components/SharedGroupPreview";
import { useAutoGroups } from "./useAutoGroups";
import { readSharedGroup } from "./share-group";

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
  const reorderCustomGroups = useStore((s) => s.reorderCustomGroups);
  const setCustomGroupLocation = useStore((s) => s.setCustomGroupLocation);
  const unlockMany = useStore((s) => s.unlockMany);
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

  const resolvedCustomGroups = useMemo<ResolvedCustomGroup[]>(
    () =>
      customGroups.map((group) => ({
        id: group.id,
        location: group.location,
        members: group.pokemonIds
          .map((id) => pokemonById[id])
          .filter((pokemon): pokemon is Pokemon => Boolean(pokemon)),
      })),
    [customGroups, pokemonById],
  );

  const customAssignedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of resolvedCustomGroups) {
      for (const pokemon of group.members) ids.add(pokemon.id);
    }
    return ids;
  }, [resolvedCustomGroups]);

  const autoPokemon = useMemo(
    () => activePokemon.filter((pokemon) => !customAssignedIds.has(pokemon.id)),
    [activePokemon, customAssignedIds],
  );
  // Heavy grouping runs in a Web Worker; previous results stay visible while a
  // new computation is in flight, so toggling/adding never blocks the UI.
  const { groups: autoGroups, isRecomputing: isAutoGroupsRecomputing } =
    useAutoGroups(autoPokemon, preferEvolutionLines);
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
  const [groupToastMessage, setGroupToastMessage] = useState<string | null>(
    null,
  );
  const [sharedGroup, setSharedGroup] = useState(() =>
    readSharedGroup(window.location.search, habitablePokemon),
  );
  const sharedPokemon = useMemo(() => {
    if (!sharedGroup) return [];
    const sharedIds = new Set(sharedGroup.pokemonIds);
    return habitablePokemon.filter((pokemon) => sharedIds.has(pokemon.id));
  }, [sharedGroup]);

  const availablePokemon = useMemo(
    () => activePokemon.filter((p) => !customAssignedIds.has(p.id)),
    [activePokemon, customAssignedIds],
  );

  const suggestions = useMemo<SuggestedPokemon[][]>(
    () =>
      resolvedCustomGroups.map((group) =>
        suggestNextPokemon(
          group.members,
          availablePokemon.filter(
            (candidate) =>
              !group.members.some((member) => member.id === candidate.id),
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
    setGroupToastMessage("Group added");
  }, [resetSuggestedFreeze, addCustomGroup]);

  const handleDeleteGroup = useCallback(
    (groupIndex: number) => {
      resetSuggestedFreeze();
      deleteCustomGroup(groupIndex);
      setGroupToastMessage("Group removed");
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

  const handleReorderGroups = useCallback(
    (activeId: string, overId: string) => {
      reorderCustomGroups(activeId, overId);
    },
    [reorderCustomGroups],
  );

  const handleLocationChange = useCallback(
    (groupIndex: number, location: PokopiaLocation | undefined) => {
      setCustomGroupLocation(groupIndex, location);
    },
    [setCustomGroupLocation],
  );

  const handleAddSharedGroup = useCallback(() => {
    if (!sharedGroup) return;
    unlockMany(sharedGroup.pokemonIds);
    addSuggestedGroupToCustomGroups(sharedGroup.pokemonIds);
    const url = new URL(window.location.href);
    url.searchParams.delete("group");
    url.searchParams.delete("location");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    setSharedGroup(null);
    setGroupToastMessage("Shared group added to My Groups");
  }, [addSuggestedGroupToCustomGroups, sharedGroup, unlockMany]);

  const hasActiveSuggestedFreeze = useMemo(
    () =>
      frozenSuggestedGroups != null &&
      freezePreferEvolutionLines === preferEvolutionLines,
    [frozenSuggestedGroups, freezePreferEvolutionLines, preferEvolutionLines],
  );

  // Latest values read by the (referentially stable) quick-add handler. Keeping
  // the handler identity stable lets the memoized suggested-groups list skip
  // re-rendering when unrelated state (e.g. the evolution switch) changes.
  const quickAddStateRef = useRef({
    hasActiveSuggestedFreeze,
    autoGroups,
    preferEvolutionLines,
  });
  quickAddStateRef.current = {
    hasActiveSuggestedFreeze,
    autoGroups,
    preferEvolutionLines,
  };

  const handleQuickAddGroup = useCallback(
    (group: Pokemon[]) => {
      const {
        hasActiveSuggestedFreeze: frozen,
        autoGroups: currentAutoGroups,
        preferEvolutionLines: currentPref,
      } = quickAddStateRef.current;
      if (!frozen) {
        setFrozenSuggestedGroups(currentAutoGroups);
        setFreezePreferEvolutionLines(currentPref);
      }
      setAdoptedSuggestedGroupKeys((prev) => {
        const base = !frozen ? new Set<string>() : prev;
        const next = new Set(base);
        next.add(groupKeyFromPokemon(group));
        return next;
      });
      addSuggestedGroupToCustomGroups(group.map((pokemon) => pokemon.id));
      setGroupToastMessage("Suggested group added");
    },
    [addSuggestedGroupToCustomGroups],
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
    () =>
      resolvedCustomGroups.map((group) => suggestItemsForGroup(group.members)),
    [resolvedCustomGroups],
  );

  if (activePokemon.length === 0 && !sharedGroup) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          py: 8,
          px: { xs: 1.5, sm: 3 },
          textAlign: "center",
        }}
      >
        <GroupsOutlinedIcon
          sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
          aria-hidden
        />
        <Typography
          sx={{
            color: "text.secondary",
            mb: 1,
          }}
        >
          No Pokémon available with current settings.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          Go to Pokédex and unlock some Pokémon first.
        </Typography>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}
    >
      <Stack spacing={0}>
        <Typography
          component="h1"
          variant="h6"
          sx={{
            fontWeight: 950,
            lineHeight: 1.1,
            mb: 0.75,
          }}
        >
          Match Maker
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 2, maxWidth: 640 }}
        >
          Build automatic or custom Pokopia habitat roommate groups, get ranked
          suggestions for who to add next, and keep everyone habitat-compatible.
        </Typography>
        {sharedGroup && sharedPokemon.length > 0 ? (
          <SharedGroupPreview
            group={sharedPokemon}
            location={sharedGroup.location}
            onAdd={handleAddSharedGroup}
          />
        ) : null}
        <Stack spacing={4}>
          <CustomGroupsSection
            customGroups={resolvedCustomGroups}
            suggestions={suggestions}
            itemSuggestions={customGroupItemSuggestions}
            availablePokemon={availablePokemon}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            onAddPokemon={handleAddPokemon}
            onRemovePokemon={handleRemovePokemon}
            onReorderGroups={handleReorderGroups}
            onLocationChange={handleLocationChange}
          />

          <AutoGroupsSection
            groups={displayedSuggestedGroups}
            preferEvolutionLines={preferEvolutionLines}
            onPreferEvolutionLinesChange={setPreferEvolutionLines}
            onQuickAddGroup={handleQuickAddGroup}
            isRecomputing={isAutoGroupsRecomputing}
          />
        </Stack>
      </Stack>
      <AppToast
        toast={
          groupToastMessage
            ? { message: groupToastMessage, severity: "success" }
            : null
        }
        onClose={() => setGroupToastMessage(null)}
      />
      <ScrollToTopFab />
    </Container>
  );
}
