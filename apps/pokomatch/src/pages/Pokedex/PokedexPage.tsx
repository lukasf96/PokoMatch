import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Container,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { habitatIcons } from "../../services/habitatColors";
import {
  allPokemon,
  eventPokemon,
  standardPokemon,
} from "../../services/pokemon";
import { useStore } from "../../store/store";
import type { Habitat, Pokemon } from "../../types/types";
import { PokemonCard } from "./components/PokemonCard";

type Filter = "all" | "unlocked" | "locked";

export default function PokedexPage() {
  const togglePokemon = useStore((s) => s.togglePokemon);
  const unlockAll = useStore((s) => s.unlockAll);
  const lockAll = useStore((s) => s.lockAll);
  const unlockedIds = useStore((s) => s.unlockedIds);

  const [search, setSearch] = useState("");
  const [habitatFilter, setHabitatFilter] = useState<Habitat | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");

  const effectiveStatusFilter = statusFilter;

  const filterList = useMemo(
    () =>
      function filterListInner(list: Pokemon[]) {
        const q = search.toLowerCase();
        return list.filter((p) => {
          if (
            q &&
            !p.name.toLowerCase().includes(q) &&
            !p.dexNumber.includes(q)
          )
            return false;
          if (habitatFilter !== "all" && p.idealHabitat !== habitatFilter)
            return false;
          return true;
        });
      },
    [search, habitatFilter],
  );

  const baseFilteredStandard = useMemo(
    () => filterList(standardPokemon),
    [filterList],
  );
  const baseFilteredEvent = useMemo(
    () => filterList(eventPokemon),
    [filterList],
  );

  const habitats = useMemo(
    () =>
      [...new Set(allPokemon.map((p) => p.idealHabitat))].sort() as Habitat[],
    [],
  );

  const totalCount = allPokemon.length;

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}
    >
      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 2 }}
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={2}
        flexWrap={{ xs: "nowrap", sm: "wrap" }}
        useFlexGap
      >
        <TextField
          size="small"
          placeholder="Search by name or #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{
            minWidth: { xs: 0, sm: 200 },
            flex: { xs: "0 0 auto", sm: "1 1 240px" },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            overflowX: { xs: "visible", sm: "auto" },
            pb: { xs: 0, sm: 0.25 },
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            fullWidth
            value={habitatFilter}
            onChange={(_, v) => v !== null && setHabitatFilter(v)}
            sx={{
              width: { xs: "100%", sm: "auto" },
              flexWrap: "nowrap",
              minWidth: { xs: 0, sm: "max-content" },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            {habitats.map((h) => (
              <HabitatToggleButton key={h} habitat={h} />
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            fullWidth
            value={statusFilter}
            onChange={(_, v) => v !== null && setStatusFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="unlocked">Unlocked</ToggleButton>
            <ToggleButton value="locked">Locked</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          ml={{ sm: "auto" }}
          width={{ xs: "100%", sm: "auto" }}
          sx={{ flexShrink: 0 }}
        >
          <Button
            size="small"
            variant="contained"
            onClick={unlockAll}
            sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
          >
            Unlock all
          </Button>
          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={lockAll}
            sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
          >
            Lock all
          </Button>
        </Stack>
      </Stack>

      {/* Count summary */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        useFlexGap
      >
        <PokedexShowingCount
          totalCount={totalCount}
          baseFilteredStandard={baseFilteredStandard}
          baseFilteredEvent={baseFilteredEvent}
          effectiveStatusFilter={effectiveStatusFilter}
          unlockedIds={unlockedIds}
        />
      </Stack>

      {effectiveStatusFilter === "all" ? (
        <PokedexSections
          baseFilteredStandard={baseFilteredStandard}
          baseFilteredEvent={baseFilteredEvent}
          interactive
          onToggle={togglePokemon}
          unlockedIds={unlockedIds}
        />
      ) : (
        <PokedexSectionsStatusFiltered
          baseFilteredStandard={baseFilteredStandard}
          baseFilteredEvent={baseFilteredEvent}
          status={effectiveStatusFilter}
          interactive
          onToggle={togglePokemon}
          unlockedIds={unlockedIds}
        />
      )}
    </Container>
  );
}

function PokedexShowingCount({
  totalCount,
  baseFilteredStandard,
  baseFilteredEvent,
  effectiveStatusFilter,
  unlockedIds,
}: {
  totalCount: number;
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  effectiveStatusFilter: Filter;
  unlockedIds: Set<string>;
}) {
  if (effectiveStatusFilter === "all") {
    const n = baseFilteredStandard.length + baseFilteredEvent.length;
    return (
      <Typography variant="body2" color="text.secondary">
        Showing {n} of {totalCount} Pokémon
      </Typography>
    );
  }

  return (
    <PokedexShowingCountWithStatus
      totalCount={totalCount}
      baseFilteredStandard={baseFilteredStandard}
      baseFilteredEvent={baseFilteredEvent}
      status={effectiveStatusFilter}
      unlockedIds={unlockedIds}
    />
  );
}

function PokedexShowingCountWithStatus({
  totalCount,
  baseFilteredStandard,
  baseFilteredEvent,
  status,
  unlockedIds,
}: {
  totalCount: number;
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  status: "unlocked" | "locked";
  unlockedIds: Set<string>;
}) {
  // Avoid allocating filtered arrays on every toggle.
  let showing = 0;
  for (const p of baseFilteredStandard) {
    const isUnlocked = unlockedIds.has(p.id);
    if (status === "unlocked" ? isUnlocked : !isUnlocked) showing += 1;
  }
  for (const p of baseFilteredEvent) {
    const isUnlocked = unlockedIds.has(p.id);
    if (status === "unlocked" ? isUnlocked : !isUnlocked) showing += 1;
  }

  return (
    <Typography variant="body2" color="text.secondary">
      Showing {showing} of {totalCount} Pokémon
    </Typography>
  );
}

function PokedexSections({
  baseFilteredStandard,
  baseFilteredEvent,
  interactive,
  onToggle,
  unlockedIds,
}: {
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  interactive: boolean;
  onToggle: (id: string) => void;
  unlockedIds: Set<string>;
}) {
  return (
    <Stack spacing={3}>
      <Box>
        <PokedexSectionHeader
          title="Standard Pokédex"
          subtitle={`${standardPokemon.length} Pokémon`}
        />
        <PokedexGrid
          pokemon={baseFilteredStandard}
          interactive={interactive}
          onToggle={onToggle}
          showEventBadge
          unlockedIds={unlockedIds}
        />
      </Box>

      <Divider />

      <Box>
        <PokedexSectionHeader
          title="Event Pokédex"
          subtitle={`${eventPokemon.length} Pokémon`}
        />
        <PokedexGrid
          pokemon={baseFilteredEvent}
          interactive={interactive}
          onToggle={onToggle}
          showEventBadge={false}
          unlockedIds={unlockedIds}
        />
      </Box>
    </Stack>
  );
}

function PokedexSectionsStatusFiltered({
  baseFilteredStandard,
  baseFilteredEvent,
  status,
  interactive,
  onToggle,
  unlockedIds,
}: {
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  status: "unlocked" | "locked";
  interactive: boolean;
  onToggle: (id: string) => void;
  unlockedIds: Set<string>;
}) {
  const filteredStandard = useMemo(() => {
    const result: Pokemon[] = [];

    for (const p of baseFilteredStandard) {
      const isUnlocked = unlockedIds.has(p.id);
      if (status === "unlocked" ? isUnlocked : !isUnlocked) {
        result.push(p);
      }
    }

    return result;
  }, [baseFilteredStandard, status, unlockedIds]);
  const filteredEvent = useMemo(() => {
    const result: Pokemon[] = [];

    for (const p of baseFilteredEvent) {
      const isUnlocked = unlockedIds.has(p.id);
      if (status === "unlocked" ? isUnlocked : !isUnlocked) {
        result.push(p);
      }
    }

    return result;
  }, [baseFilteredEvent, status, unlockedIds]);

  return (
    <PokedexSections
      baseFilteredStandard={filteredStandard}
      baseFilteredEvent={filteredEvent}
      interactive={interactive}
      onToggle={onToggle}
      unlockedIds={unlockedIds}
    />
  );
}

function PokedexSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <Stack spacing={0.25} mb={{ xs: 1, sm: 1.5 }}>
      <Typography
        variant="h6"
        component="h2"
        fontWeight={700}
        sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
      >
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    </Stack>
  );
}

function HabitatToggleButton({ habitat }: { habitat: Habitat }) {
  const HabitatIcon = habitatIcons[habitat];

  return (
    <ToggleButton value={habitat}>
      <Tooltip title={habitat}>
        <Box
          component="span"
          sx={{ display: "inline-flex", alignItems: "center" }}
        >
          <HabitatIcon sx={{ fontSize: 16 }} />
        </Box>
      </Tooltip>
    </ToggleButton>
  );
}

function PokedexGrid({
  pokemon,
  interactive,
  onToggle,
  showEventBadge,
  unlockedIds,
}: {
  pokemon: Pokemon[];
  interactive: boolean;
  onToggle: (id: string) => void;
  showEventBadge: boolean;
  unlockedIds: Set<string>;
}) {
  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(auto-fill, minmax(156px, 1fr))",
            sm: "repeat(auto-fill, minmax(200px, 1fr))",
          },
          gap: { xs: 0.75, sm: 1 },
        }}
      >
        {pokemon.map((p) => (
          <PokemonCard
            key={p.id}
            pokemon={p}
            interactive={interactive}
            onToggle={onToggle}
            showEventBadge={showEventBadge}
            unlocked={unlockedIds.has(p.id)}
          />
        ))}
      </Box>

      {pokemon.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            No Pokémon match your filters.
          </Typography>
        </Box>
      )}
    </>
  );
}
