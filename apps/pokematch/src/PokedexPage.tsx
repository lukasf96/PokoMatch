import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo, useMemo, useState } from "react";
import { habitatColors, habitatEmoji } from "./habitatColors";
import { allPokemon, eventPokemon, standardPokemon } from "./pokemon";
import { useStore } from "./store";
import type { Habitat, Pokemon } from "./types";

type Filter = "all" | "unlocked" | "locked";

export default function PokedexPage() {
  const togglePokemon = useStore((s) => s.togglePokemon);
  const unlockAll = useStore((s) => s.unlockAll);
  const lockAll = useStore((s) => s.lockAll);

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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        Pokédex
      </Typography>

      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={2}
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          size="small"
          placeholder="Search by name or #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200, flex: "1 1 200px" }}
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

        <ToggleButtonGroup
          size="small"
          exclusive
          value={habitatFilter}
          onChange={(_, v) => v !== null && setHabitatFilter(v)}
        >
          <ToggleButton value="all">All</ToggleButton>
          {habitats.map((h) => (
            <ToggleButton key={h} value={h}>
              <Tooltip title={h}>
                <span>{habitatEmoji[h]}</span>
              </Tooltip>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={statusFilter}
          onChange={(_, v) => v !== null && setStatusFilter(v)}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="unlocked">Unlocked</ToggleButton>
          <ToggleButton value="locked">Locked</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1} ml={{ sm: "auto" }}>
          <Button size="small" variant="outlined" onClick={unlockAll}>
            Select all
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={lockAll}
          >
            Deselect all
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
        />
      </Stack>

      {effectiveStatusFilter === "all" ? (
        <PokedexSections
          baseFilteredStandard={baseFilteredStandard}
          baseFilteredEvent={baseFilteredEvent}
          interactive
          onToggle={togglePokemon}
        />
      ) : (
        <PokedexSectionsStatusFiltered
          baseFilteredStandard={baseFilteredStandard}
          baseFilteredEvent={baseFilteredEvent}
          status={effectiveStatusFilter}
          interactive
          onToggle={togglePokemon}
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
}: {
  totalCount: number;
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  effectiveStatusFilter: Filter;
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
    />
  );
}

function PokedexShowingCountWithStatus({
  totalCount,
  baseFilteredStandard,
  baseFilteredEvent,
  status,
}: {
  totalCount: number;
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  status: "unlocked" | "locked";
}) {
  const showing = useStore(
    (s) =>
      baseFilteredStandard.filter((p) =>
        status === "unlocked"
          ? s.unlockedIds.has(p.id)
          : !s.unlockedIds.has(p.id),
      ).length +
      baseFilteredEvent.filter((p) =>
        status === "unlocked"
          ? s.unlockedIds.has(p.id)
          : !s.unlockedIds.has(p.id),
      ).length,
  );

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
}: {
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  interactive: boolean;
  onToggle: (id: string) => void;
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
}: {
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  status: "unlocked" | "locked";
  interactive: boolean;
  onToggle: (id: string) => void;
}) {
  const unlockedIds = useStore((s) => s.unlockedIds);
  const filteredStandard = useMemo(
    () =>
      baseFilteredStandard.filter((p) =>
        status === "unlocked" ? unlockedIds.has(p.id) : !unlockedIds.has(p.id),
      ),
    [baseFilteredStandard, status, unlockedIds],
  );
  const filteredEvent = useMemo(
    () =>
      baseFilteredEvent.filter((p) =>
        status === "unlocked" ? unlockedIds.has(p.id) : !unlockedIds.has(p.id),
      ),
    [baseFilteredEvent, status, unlockedIds],
  );

  return (
    <PokedexSections
      baseFilteredStandard={filteredStandard}
      baseFilteredEvent={filteredEvent}
      interactive={interactive}
      onToggle={onToggle}
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
    <Stack spacing={0.25} mb={1.5}>
      <Typography variant="h6" component="h2" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    </Stack>
  );
}

function PokedexGrid({
  pokemon,
  interactive,
  onToggle,
  showEventBadge,
}: {
  pokemon: Pokemon[];
  interactive: boolean;
  onToggle: (id: string) => void;
  showEventBadge: boolean;
}) {
  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 1,
        }}
      >
        {pokemon.map((p) => (
          <PokemonCard
            key={p.id}
            pokemon={p}
            interactive={interactive}
            onToggle={onToggle}
            showEventBadge={showEventBadge}
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

const PokemonCard = memo(function PokemonCard({
  pokemon,
  interactive,
  onToggle,
  showEventBadge,
}: {
  pokemon: Pokemon;
  interactive: boolean;
  onToggle: (id: string) => void;
  showEventBadge: boolean;
}) {
  const unlocked = useStore((s) => s.unlockedIds.has(pokemon.id));
  const colors = habitatColors[pokemon.idealHabitat as Habitat];
  const isEvent = pokemon.id.startsWith("e");
  const isNotHabitable = pokemon.isHabitable === false;

  return (
    <Paper
      variant="outlined"
      onClick={interactive ? () => onToggle(pokemon.id) : undefined}
      sx={{
        borderRadius: 1.5,
        overflow: "hidden",
        cursor: interactive ? "pointer" : "default",
        opacity: unlocked ? 1 : 0.45,
        borderColor: unlocked ? colors.border : "divider",
        transition: "opacity 0.15s, border-color 0.15s, box-shadow 0.15s",
        "&:hover": interactive
          ? {
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              opacity: unlocked ? 1 : 0.65,
            }
          : undefined,
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          bgcolor: unlocked ? colors.bg : "grey.100",
          px: 1.5,
          py: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background-color 0.15s",
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" minWidth={0}>
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ fontSize: 11, flexShrink: 0 }}
          >
            #{pokemon.dexNumber}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            color={unlocked ? colors.text : "text.secondary"}
          >
            {pokemon.name}
          </Typography>
          {showEventBadge && isEvent && (
            <Chip
              label="Event"
              size="small"
              sx={{
                height: 14,
                fontSize: 9,
                bgcolor: "secondary.light",
                color: "secondary.dark",
                flexShrink: 0,
              }}
            />
          )}
          {isNotHabitable && (
            <Chip
              label="Not habitable"
              size="small"
              sx={{
                height: 14,
                fontSize: 9,
                bgcolor: "warning.light",
                color: "warning.dark",
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
        {interactive &&
          (unlocked ? (
            <CheckBoxIcon
              sx={{ fontSize: 18, color: colors.text, flexShrink: 0 }}
            />
          ) : (
            <CheckBoxOutlineBlankIcon
              sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }}
            />
          ))}
      </Box>

      <Divider />

      <Box sx={{ px: 1.5, py: 0.75 }}>
        <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
          <Typography sx={{ fontSize: 12 }}>
            {habitatEmoji[pokemon.idealHabitat as Habitat]}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: 11 }}
            color="text.secondary"
          >
            {pokemon.idealHabitat}
          </Typography>
        </Stack>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
          {pokemon.favorites.map((fav) => (
            <Chip
              key={fav}
              label={fav}
              size="small"
              sx={{ height: 16, fontSize: 9, bgcolor: "grey.100" }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
});
