import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import StarsIcon from "@mui/icons-material/Stars";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useCallback,
  useMemo,
  useState,
  type SyntheticEvent,
} from "react";
import { contentSkeletonSx } from "../../components/ContentSkeleton";
import {
  DeferredMount,
  DeferredMountGate,
} from "../../components/DeferredMount";
import { InstantCollapse } from "../../components/InstantCollapse";
import { PokemonCard } from "../../components/PokemonCard";
import { ScrollToTopFab } from "../../components/ScrollToTopFab";
import { useScrollToHash } from "../../hooks/useScrollToHash";
import { habitatIcons } from "../../services/habitatColors";
import {
  allPokemon,
  basinPokemon,
  eventPokemon,
  standardPokemon,
} from "../../services/pokemon";
import { useStore } from "../../store/store";
import type { Habitat, Pokemon } from "../../types/types";

type Filter = "all" | "unlocked" | "locked";
type SectionKey = "standard" | "event" | "basin";

const SECTION_IDS: Record<SectionKey, string> = {
  standard: "standard",
  event: "event",
  basin: "basin",
};

const standardIds = standardPokemon.map((p) => p.id);
const eventIds = eventPokemon.map((p) => p.id);
const basinIds = basinPokemon.map((p) => p.id);

const DEFAULT_EXPANDED: Record<SectionKey, boolean> = {
  standard: true,
  event: true,
  basin: true,
};

export default function PokedexPage() {
  const togglePokemon = useStore((s) => s.togglePokemon);
  const unlockAll = useStore((s) => s.unlockAll);
  const lockAll = useStore((s) => s.lockAll);
  const unlockMany = useStore((s) => s.unlockMany);
  const lockMany = useStore((s) => s.lockMany);
  const unlockedIds = useStore((s) => s.unlockedIds);

  const [search, setSearch] = useState("");
  const [habitatFilter, setHabitatFilter] = useState<Habitat | "all">("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [expanded, setExpanded] =
    useState<Record<SectionKey, boolean>>(DEFAULT_EXPANDED);

  const effectiveStatusFilter = statusFilter;
  const [deferredGridsReady, setDeferredGridsReady] = useState(false);

  const handleHashTarget = useCallback((id: string) => {
    if (id !== SECTION_IDS.basin) return;
    setExpanded((prev) => (prev.basin ? prev : { ...prev, basin: true }));
  }, []);

  useScrollToHash({
    contentReady: deferredGridsReady,
    onHash: handleHashTarget,
  });

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
          if (
            specialtyFilter !== "all" &&
            !p.specialties.includes(specialtyFilter)
          )
            return false;
          return true;
        });
      },
    [search, habitatFilter, specialtyFilter],
  );

  const baseFilteredStandard = useMemo(
    () => filterList(standardPokemon),
    [filterList],
  );
  const baseFilteredEvent = useMemo(
    () => filterList(eventPokemon),
    [filterList],
  );
  const baseFilteredBasin = useMemo(
    () => filterList(basinPokemon),
    [filterList],
  );

  const habitats = useMemo(
    () =>
      [...new Set(allPokemon.map((p) => p.idealHabitat))].sort() as Habitat[],
    [],
  );

  const specialties = useMemo(
    () =>
      [...new Set(allPokemon.flatMap((p) => p.specialties))].sort() as string[],
    [],
  );

  const totalCount = allPokemon.length;

  const handleSectionExpandedChange =
    (key: SectionKey) => (_: SyntheticEvent, isExpanded: boolean) => {
      setExpanded((prev) => ({ ...prev, [key]: isExpanded }));
    };

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}
    >
      <Typography
        component="h1"
        variant="h6"
        sx={{
          fontWeight: 950,
          lineHeight: 1.1,
          mb: 0.75,
        }}
      >
        Pokopia Pokédex
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mb: 2, maxWidth: 640 }}
      >
        Browse Standard, Event, and Basin Pokédex entries for Pokémon Pokopia.
        Search, filter by habitat, and lock or unlock species so our Match-Maker
        only uses your available Pokémon.
      </Typography>
      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 2 }}
        useFlexGap
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          mb: 2,
          flexWrap: { xs: "nowrap", sm: "wrap" },
        }}
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

        <TextField
          select
          size="small"
          label="Specialty"
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          sx={{
            minWidth: { xs: "100%", sm: 160 },
            flexShrink: 0,
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <StarsIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        >
          <MenuItem value="all">All specialties</MenuItem>
          {specialties.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            ml: { sm: "auto" },
            width: { xs: "100%", sm: "auto" },
            flexShrink: 0,
          }}
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
        useFlexGap
        sx={{
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <PokedexShowingCount
          totalCount={totalCount}
          baseFilteredStandard={baseFilteredStandard}
          baseFilteredEvent={baseFilteredEvent}
          baseFilteredBasin={baseFilteredBasin}
          effectiveStatusFilter={effectiveStatusFilter}
          unlockedIds={unlockedIds}
        />
      </Stack>
      <DeferredMountGate onReady={() => setDeferredGridsReady(true)}>
        {effectiveStatusFilter === "all" ? (
          <PokedexSections
            baseFilteredStandard={baseFilteredStandard}
            baseFilteredEvent={baseFilteredEvent}
            baseFilteredBasin={baseFilteredBasin}
            interactive
            onToggle={togglePokemon}
            unlockedIds={unlockedIds}
            expanded={expanded}
            onExpandedChange={handleSectionExpandedChange}
            onUnlockSection={unlockMany}
            onLockSection={lockMany}
          />
        ) : (
          <PokedexSectionsStatusFiltered
            baseFilteredStandard={baseFilteredStandard}
            baseFilteredEvent={baseFilteredEvent}
            baseFilteredBasin={baseFilteredBasin}
            status={effectiveStatusFilter}
            interactive
            onToggle={togglePokemon}
            unlockedIds={unlockedIds}
            expanded={expanded}
            onExpandedChange={handleSectionExpandedChange}
            onUnlockSection={unlockMany}
            onLockSection={lockMany}
          />
        )}
      </DeferredMountGate>
      <ScrollToTopFab />
    </Container>
  );
}

function PokedexShowingCount({
  totalCount,
  baseFilteredStandard,
  baseFilteredEvent,
  baseFilteredBasin,
  effectiveStatusFilter,
  unlockedIds,
}: {
  totalCount: number;
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  baseFilteredBasin: Pokemon[];
  effectiveStatusFilter: Filter;
  unlockedIds: Set<string>;
}) {
  if (effectiveStatusFilter === "all") {
    const n =
      baseFilteredStandard.length +
      baseFilteredEvent.length +
      baseFilteredBasin.length;
    return (
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
        }}
      >
        Showing {n} of {totalCount} Pokémon
      </Typography>
    );
  }

  return (
    <PokedexShowingCountWithStatus
      totalCount={totalCount}
      baseFilteredStandard={baseFilteredStandard}
      baseFilteredEvent={baseFilteredEvent}
      baseFilteredBasin={baseFilteredBasin}
      status={effectiveStatusFilter}
      unlockedIds={unlockedIds}
    />
  );
}

function PokedexShowingCountWithStatus({
  totalCount,
  baseFilteredStandard,
  baseFilteredEvent,
  baseFilteredBasin,
  status,
  unlockedIds,
}: {
  totalCount: number;
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  baseFilteredBasin: Pokemon[];
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
  for (const p of baseFilteredBasin) {
    const isUnlocked = unlockedIds.has(p.id);
    if (status === "unlocked" ? isUnlocked : !isUnlocked) showing += 1;
  }

  return (
    <Typography
      variant="body2"
      sx={{
        color: "text.secondary",
      }}
    >
      Showing {showing} of {totalCount} Pokémon
    </Typography>
  );
}

function PokedexSections({
  baseFilteredStandard,
  baseFilteredEvent,
  baseFilteredBasin,
  interactive,
  onToggle,
  unlockedIds,
  expanded,
  onExpandedChange,
  onUnlockSection,
  onLockSection,
}: {
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  baseFilteredBasin: Pokemon[];
  interactive: boolean;
  onToggle: (id: string) => void;
  unlockedIds: Set<string>;
  expanded: Record<SectionKey, boolean>;
  onExpandedChange: (
    key: SectionKey,
  ) => (_: SyntheticEvent, isExpanded: boolean) => void;
  onUnlockSection: (ids: readonly string[]) => void;
  onLockSection: (ids: readonly string[]) => void;
}) {
  return (
    <Stack spacing={1.5}>
      <PokedexSection
        id={SECTION_IDS.standard}
        title="Standard Pokédex"
        subtitle={`${standardPokemon.length} Pokémon`}
        pokemon={baseFilteredStandard}
        sectionIds={standardIds}
        expanded={expanded.standard}
        onExpandedChange={onExpandedChange("standard")}
        interactive={interactive}
        onToggle={onToggle}
        unlockedIds={unlockedIds}
        onUnlockSection={onUnlockSection}
        onLockSection={onLockSection}
      />

      <PokedexSection
        id={SECTION_IDS.event}
        title="Event Pokédex"
        subtitle={`${eventPokemon.length} Pokémon`}
        pokemon={baseFilteredEvent}
        sectionIds={eventIds}
        expanded={expanded.event}
        onExpandedChange={onExpandedChange("event")}
        interactive={interactive}
        onToggle={onToggle}
        unlockedIds={unlockedIds}
        onUnlockSection={onUnlockSection}
        onLockSection={onLockSection}
      />

      <PokedexSection
        id={SECTION_IDS.basin}
        title="Basin Pokédex"
        subtitle={`${basinPokemon.length} Pokémon`}
        pokemon={baseFilteredBasin}
        sectionIds={basinIds}
        expanded={expanded.basin}
        onExpandedChange={onExpandedChange("basin")}
        interactive={interactive}
        onToggle={onToggle}
        unlockedIds={unlockedIds}
        onUnlockSection={onUnlockSection}
        onLockSection={onLockSection}
      />
    </Stack>
  );
}

function PokedexSectionsStatusFiltered({
  baseFilteredStandard,
  baseFilteredEvent,
  baseFilteredBasin,
  status,
  interactive,
  onToggle,
  unlockedIds,
  expanded,
  onExpandedChange,
  onUnlockSection,
  onLockSection,
}: {
  baseFilteredStandard: Pokemon[];
  baseFilteredEvent: Pokemon[];
  baseFilteredBasin: Pokemon[];
  status: "unlocked" | "locked";
  interactive: boolean;
  onToggle: (id: string) => void;
  unlockedIds: Set<string>;
  expanded: Record<SectionKey, boolean>;
  onExpandedChange: (
    key: SectionKey,
  ) => (_: SyntheticEvent, isExpanded: boolean) => void;
  onUnlockSection: (ids: readonly string[]) => void;
  onLockSection: (ids: readonly string[]) => void;
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
  const filteredBasin = useMemo(() => {
    const result: Pokemon[] = [];

    for (const p of baseFilteredBasin) {
      const isUnlocked = unlockedIds.has(p.id);
      if (status === "unlocked" ? isUnlocked : !isUnlocked) {
        result.push(p);
      }
    }

    return result;
  }, [baseFilteredBasin, status, unlockedIds]);

  return (
    <PokedexSections
      baseFilteredStandard={filteredStandard}
      baseFilteredEvent={filteredEvent}
      baseFilteredBasin={filteredBasin}
      interactive={interactive}
      onToggle={onToggle}
      unlockedIds={unlockedIds}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      onUnlockSection={onUnlockSection}
      onLockSection={onLockSection}
    />
  );
}

function PokedexSection({
  id,
  title,
  subtitle,
  pokemon,
  sectionIds,
  expanded,
  onExpandedChange,
  interactive,
  onToggle,
  unlockedIds,
  onUnlockSection,
  onLockSection,
}: {
  id: string;
  title: string;
  subtitle: string;
  pokemon: Pokemon[];
  sectionIds: readonly string[];
  expanded: boolean;
  onExpandedChange: (_: SyntheticEvent, isExpanded: boolean) => void;
  interactive: boolean;
  onToggle: (id: string) => void;
  unlockedIds: Set<string>;
  onUnlockSection: (ids: readonly string[]) => void;
  onLockSection: (ids: readonly string[]) => void;
}) {
  return (
    <Accordion
      id={id}
      disableGutters
      elevation={0}
      expanded={expanded}
      onChange={onExpandedChange}
      slots={{ transition: InstantCollapse }}
      sx={{
        scrollMarginTop: 88,
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon aria-hidden />}
        aria-controls={`${id}-content`}
        id={`${id}-header`}
        sx={{
          px: { xs: 1.25, sm: 1.5 },
          py: 0.75,
          minHeight: 0,
          "&.Mui-expanded": { minHeight: 0 },
          "& .MuiAccordionSummary-content": {
            margin: 0,
            alignItems: "center",
            my: 0.5,
          },
          "& .MuiAccordionSummary-content.Mui-expanded": { margin: 0, my: 0.5 },
          "& .MuiAccordionSummary-expandIconWrapper": {
            transition: "none",
          },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            width: "100%",
            pr: 1,
            minWidth: 0,
          }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
              }}
            >
              {subtitle}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={() => onUnlockSection(sectionIds)}
              sx={{ whiteSpace: "nowrap" }}
            >
              Unlock all
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => onLockSection(sectionIds)}
              sx={{ whiteSpace: "nowrap" }}
            >
              Lock all
            </Button>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails
        id={`${id}-content`}
        sx={{ px: { xs: 1.25, sm: 1.5 }, pt: 0, pb: { xs: 1.5, sm: 2 } }}
      >
        <PokedexGrid
          pokemon={pokemon}
          interactive={interactive}
          onToggle={onToggle}
          unlockedIds={unlockedIds}
        />
      </AccordionDetails>
    </Accordion>
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
  unlockedIds,
}: {
  pokemon: Pokemon[];
  interactive: boolean;
  onToggle: (id: string) => void;
  unlockedIds: Set<string>;
}) {
  return (
    <DeferredMount
      fallback={
        <Box
          aria-hidden
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(auto-fill, minmax(156px, 1fr))",
              sm: "repeat(auto-fill, minmax(200px, 1fr))",
            },
            gap: { xs: 0.75, sm: 1 },
          }}
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              animation="wave"
              height={148}
              sx={contentSkeletonSx}
            />
          ))}
        </Box>
      }
    >
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
            unlocked={unlockedIds.has(p.id)}
          />
        ))}
      </Box>
      {pokemon.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography
            sx={{
              color: "text.secondary",
            }}
          >
            No Pokémon match your filters.
          </Typography>
        </Box>
      )}
    </DeferredMount>
  );
}
