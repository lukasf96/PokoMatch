import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import CatchingPokemonOutlinedIcon from "@mui/icons-material/CatchingPokemonOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
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

  const hasActiveSuggestedFreeze = useMemo(
    () =>
      frozenSuggestedGroups != null &&
      freezePreferEvolutionLines === preferEvolutionLines,
    [frozenSuggestedGroups, freezePreferEvolutionLines, preferEvolutionLines],
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
        <Typography variant="h6" component="h1" fontWeight={700}>
          Match-Maker
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: 2,
            bgcolor: "action.hover",
            borderColor: "divider",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={700} component="p">
              Roommates who actually click - in Pokopia
            </Typography>
            <Typography variant="body2" color="text.secondary" component="p">
              Building a thriving world in Pokopia means finding the right
              roommates. With a growing Pokédex and specific habitat needs,
              spotting the perfect fit for a full house of four can be a
              challenge.
            </Typography>
            <Typography variant="body2" color="text.secondary" component="p">
              PokoMatch is your shortcut: we find the Pokémon that love living
              together so you can spend less time guessing and more time
              building. Everything below updates instantly as your Pokédex or
              groups change.
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoFixHighOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Automated matching
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Find perfect roommate groups based on shared likes and
                      habitat fit.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SaveOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Always Saved
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your groups and choices are kept right here locally, no
                      account needed.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CatchingPokemonOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Your Collection
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only matches with Pokémon you've unlocked in your Pokédex.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <TipsAndUpdatesOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Smart Suggestions
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get smart suggestions on who to add to your groups next.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Paper>

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
            preferEvolutionLines={preferEvolutionLines}
            onPreferEvolutionLinesChange={setPreferEvolutionLines}
            onQuickAddGroup={(group) => {
              if (!hasActiveSuggestedFreeze) {
                setFrozenSuggestedGroups(autoGroups);
                setFreezePreferEvolutionLines(preferEvolutionLines);
              }
              setAdoptedSuggestedGroupKeys((prev) => {
                const base = !hasActiveSuggestedFreeze
                  ? new Set<string>()
                  : prev;
                const next = new Set(base);
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
