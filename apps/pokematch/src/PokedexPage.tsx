import { memo, useMemo, useState } from 'react'
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
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import type { Pokemon, Habitat } from './types'
import { habitatColors, habitatEmoji } from './habitatColors'
import { useStore } from './store'

interface Props {
  // The pokemon available for selection (respects events toggle, but not custom filter)
  pokemon: Pokemon[]
}

type Filter = 'all' | 'unlocked' | 'locked'

export default function PokedexPage({ pokemon }: Props) {
  const mode = useStore((s) => s.mode)
  const togglePokemon = useStore((s) => s.togglePokemon)
  const unlockAll = useStore((s) => s.unlockAll)
  const lockAll = useStore((s) => s.lockAll)

  const [search, setSearch] = useState('')
  const [habitatFilter, setHabitatFilter] = useState<Habitat | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Filter>('all')

  const effectiveStatusFilter = mode === 'custom' ? statusFilter : 'all'

  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase()
    return pokemon.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.dexNumber.includes(q)) return false
      if (habitatFilter !== 'all' && p.idealHabitat !== habitatFilter) return false
      return true
    })
  }, [pokemon, search, habitatFilter])

  const habitats = [...new Set(pokemon.map((p) => p.idealHabitat))].sort() as Habitat[]

  const isCustom = mode === 'custom'

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        {isCustom ? 'Your Pokédex' : 'Pokédex'}
      </Typography>

      {/* Toolbar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={2}
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          size="small"
          placeholder="Search by name or #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200, flex: '1 1 200px' }}
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

        {isCustom && (
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
        )}

        {isCustom && (
          <Stack direction="row" spacing={1} ml={{ sm: 'auto' }}>
            <Button size="small" variant="outlined" onClick={unlockAll}>
              Select all
            </Button>
            <Button size="small" variant="outlined" color="warning" onClick={lockAll}>
              Deselect all
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Count summary */}
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <PokedexShowingCount
          pokemon={pokemon}
          baseFiltered={baseFiltered}
          effectiveStatusFilter={effectiveStatusFilter}
        />
        {isCustom && <UnlockedCountChip pokemon={pokemon} />}
      </Stack>

      {/* Grid — when status is "all", parents do not subscribe to unlockedIds, so only the toggled card re-renders */}
      {effectiveStatusFilter === 'all' ? (
        <PokedexGrid pokemon={baseFiltered} interactive={isCustom} onToggle={togglePokemon} />
      ) : (
        <PokedexGridStatusFiltered
          baseFiltered={baseFiltered}
          status={effectiveStatusFilter}
          interactive={isCustom}
          onToggle={togglePokemon}
        />
      )}
    </Container>
  )
}

function UnlockedCountChip({ pokemon }: { pokemon: Pokemon[] }) {
  const unlockedCount = useStore((s) =>
    pokemon.reduce((n, p) => n + (s.unlockedIds.has(p.id) ? 1 : 0), 0),
  )

  return (
    <Chip
      label={`${unlockedCount} unlocked`}
      size="small"
      color="success"
      variant="outlined"
      sx={{ height: 20, fontSize: 11 }}
    />
  )
}

function PokedexShowingCount({
  pokemon,
  baseFiltered,
  effectiveStatusFilter,
}: {
  pokemon: Pokemon[]
  baseFiltered: Pokemon[]
  effectiveStatusFilter: Filter
}) {
  if (effectiveStatusFilter === 'all') {
    return (
      <Typography variant="body2" color="text.secondary">
        Showing {baseFiltered.length} of {pokemon.length} Pokémon
      </Typography>
    )
  }

  return (
    <PokedexShowingCountWithStatus
      pokemon={pokemon}
      baseFiltered={baseFiltered}
      status={effectiveStatusFilter}
    />
  )
}

function PokedexShowingCountWithStatus({
  pokemon,
  baseFiltered,
  status,
}: {
  pokemon: Pokemon[]
  baseFiltered: Pokemon[]
  status: 'unlocked' | 'locked'
}) {
  const showing = useStore((s) =>
    baseFiltered.filter((p) =>
      status === 'unlocked' ? s.unlockedIds.has(p.id) : !s.unlockedIds.has(p.id),
    ).length,
  )

  return (
    <Typography variant="body2" color="text.secondary">
      Showing {showing} of {pokemon.length} Pokémon
    </Typography>
  )
}

function PokedexGridStatusFiltered({
  baseFiltered,
  status,
  interactive,
  onToggle,
}: {
  baseFiltered: Pokemon[]
  status: 'unlocked' | 'locked'
  interactive: boolean
  onToggle: (id: string) => void
}) {
  const unlockedIds = useStore((s) => s.unlockedIds)
  const filtered = useMemo(
    () =>
      baseFiltered.filter((p) =>
        status === 'unlocked' ? unlockedIds.has(p.id) : !unlockedIds.has(p.id),
      ),
    [baseFiltered, status, unlockedIds],
  )

  return <PokedexGrid pokemon={filtered} interactive={interactive} onToggle={onToggle} />
}

function PokedexGrid({
  pokemon,
  interactive,
  onToggle,
}: {
  pokemon: Pokemon[]
  interactive: boolean
  onToggle: (id: string) => void
}) {
  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1,
        }}
      >
        {pokemon.map((p) => (
          <PokemonCard key={p.id} pokemon={p} interactive={interactive} onToggle={onToggle} />
        ))}
      </Box>

      {pokemon.length === 0 && (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No Pokémon match your filters.</Typography>
        </Box>
      )}
    </>
  )
}

const PokemonCard = memo(function PokemonCard({
  pokemon,
  interactive,
  onToggle,
}: {
  pokemon: Pokemon
  interactive: boolean
  onToggle: (id: string) => void
}) {
  const unlocked = useStore((s) => s.unlockedIds.has(pokemon.id))
  const colors = habitatColors[pokemon.idealHabitat as Habitat]
  const isEvent = pokemon.id.startsWith('e')

  return (
    <Paper
      variant="outlined"
      onClick={interactive ? () => onToggle(pokemon.id) : undefined}
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : 'default',
        opacity: unlocked ? 1 : 0.45,
        borderColor: unlocked ? colors.border : '#e0e0e0',
        transition: 'opacity 0.15s, border-color 0.15s, box-shadow 0.15s',
        '&:hover': interactive
          ? {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              opacity: unlocked ? 1 : 0.65,
            }
          : undefined,
        userSelect: 'none',
      }}
    >
      <Box
        sx={{
          bgcolor: unlocked ? colors.bg : '#f5f5f5',
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background-color 0.15s',
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" minWidth={0}>
          <Typography variant="body2" color="text.disabled" sx={{ fontSize: 11, flexShrink: 0 }}>
            #{pokemon.dexNumber}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            color={unlocked ? colors.text : 'text.secondary'}
          >
            {pokemon.name}
          </Typography>
          {isEvent && (
            <Chip
              label="Event"
              size="small"
              sx={{ height: 14, fontSize: 9, bgcolor: '#f3e5f5', color: '#7b1fa2', flexShrink: 0 }}
            />
          )}
        </Stack>
        {interactive &&
          (unlocked ? (
            <CheckBoxIcon sx={{ fontSize: 18, color: colors.text, flexShrink: 0 }} />
          ) : (
            <CheckBoxOutlineBlankIcon sx={{ fontSize: 18, color: '#bdbdbd', flexShrink: 0 }} />
          ))}
      </Box>

      <Divider />

      <Box sx={{ px: 1.5, py: 0.75 }}>
        <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
          <Typography sx={{ fontSize: 12 }}>{habitatEmoji[pokemon.idealHabitat as Habitat]}</Typography>
          <Typography variant="body2" sx={{ fontSize: 11 }} color="text.secondary">
            {pokemon.idealHabitat}
          </Typography>
        </Stack>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
          {pokemon.favorites.map((fav) => (
            <Chip
              key={fav}
              label={fav}
              size="small"
              sx={{ height: 16, fontSize: 9, bgcolor: '#f5f5f5' }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  )
})
