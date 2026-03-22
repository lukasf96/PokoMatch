import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import rawData from './pokedex.json'
import type { Pokemon, Habitat } from './types'
import { computeHabitatGroups } from './matching'
import { groupScore } from './matching'
import { habitatColors, habitatEmoji } from './habitatColors'
import OverviewTab from './OverviewTab'
import PokedexPage from './PokedexPage'
import { useStore } from './store'

const standardPokemon = rawData.standard as Pokemon[]
const eventPokemon = rawData.event as Pokemon[]
const allPokemon = [...standardPokemon, ...eventPokemon]

type Page = 'matcher' | 'pokedex'
const OVERVIEW_TAB = 0

export default function App() {
  const { mode, setMode, includeEvents, setIncludeEvents, unlockedIds, resetToDefault } =
    useStore()
  const [page, setPage] = useState<Page>('matcher')
  const [activeTab, setActiveTab] = useState(0)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  // The pool of pokemon fed into matching logic
  const activePokemon = useMemo(() => {
    const base = includeEvents ? allPokemon : standardPokemon
    if (mode === 'custom') return base.filter((p) => unlockedIds.has(p.id))
    return base
  }, [mode, includeEvents, unlockedIds])

  const habitatGroups = useMemo(() => computeHabitatGroups(activePokemon), [activePokemon])

  const isOverview = activeTab === OVERVIEW_TAB
  const current = isOverview ? null : habitatGroups[activeTab - 1]

  const customUnlockedCount = useMemo(
    () => allPokemon.filter((p) => unlockedIds.has(p.id)).length,
    [unlockedIds],
  )

  function handleReset() {
    resetToDefault()
    setResetDialogOpen(false)
    setActiveTab(0)
    setPage('matcher')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} letterSpacing={-0.5}>
            Pokopia Match-Maker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activePokemon.length} Pokémon active
            {mode === 'custom' && (
              <> &middot; {customUnlockedCount} / {allPokemon.length} unlocked</>
            )}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          {/* Mode toggle */}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v) => {
              if (v) {
                setMode(v)
                setActiveTab(0)
              }
            }}
          >
            <ToggleButton value="standard">Standard</ToggleButton>
            <ToggleButton value="custom">
              Custom
              {mode === 'custom' && (
                <Chip
                  label={customUnlockedCount}
                  size="small"
                  sx={{ ml: 0.75, height: 16, fontSize: 10 }}
                />
              )}
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Event toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={includeEvents}
                onChange={(e) => {
                  setIncludeEvents(e.target.checked)
                  setActiveTab(0)
                }}
                size="small"
              />
            }
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="body2">Events</Typography>
                <Chip
                  label={eventPokemon.length}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 11,
                    bgcolor: includeEvents ? '#f3e5f5' : '#f5f5f5',
                    color: includeEvents ? '#7b1fa2' : 'text.disabled',
                  }}
                />
              </Stack>
            }
            sx={{ mr: 0 }}
          />

          {/* Reset */}
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<RestartAltIcon />}
            onClick={() => setResetDialogOpen(true)}
          >
            Reset
          </Button>
        </Stack>
      </Box>

      {/* Page nav */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0', px: 3 }}>
        <Stack direction="row" spacing={3}>
          <NavLink active={page === 'matcher'} onClick={() => setPage('matcher')}>
            Match-Maker
          </NavLink>
          <NavLink active={page === 'pokedex'} onClick={() => setPage('pokedex')}>
            Pokédex
            {mode === 'custom' && (
              <Chip
                label={`${customUnlockedCount}/${allPokemon.length}`}
                size="small"
                sx={{ ml: 0.75, height: 16, fontSize: 10 }}
              />
            )}
          </NavLink>
        </Stack>
      </Box>

      {/* Match-Maker page */}
      {page === 'matcher' && (
        <>
          <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Overview" />
              {habitatGroups.map((hg, i) => (
                <Tab
                  key={hg.habitat}
                  label={
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <span>{habitatEmoji[hg.habitat]}</span>
                      <span>{hg.habitat}</span>
                      <Chip
                        label={hg.pokemon.length}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 11,
                          bgcolor:
                            activeTab === i + 1 ? habitatColors[hg.habitat].bg : undefined,
                        }}
                      />
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          </Box>

          <Container maxWidth="lg" sx={{ py: 3 }}>
            {activePokemon.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography color="text.secondary" mb={1}>
                  No Pokémon available with current settings.
                </Typography>
                {mode === 'custom' && (
                  <Typography variant="body2" color="text.secondary">
                    Go to Pokédex and unlock some Pokémon first.
                  </Typography>
                )}
              </Box>
            ) : isOverview ? (
              <OverviewTab pokemon={activePokemon} />
            ) : current ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {habitatEmoji[current.habitat]} {current.habitat} Habitat
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    — {current.pokemon.length} Pokémon across {current.groups.length} groups
                  </Typography>
                </Stack>
                <Stack spacing={2}>
                  {current.groups.map((group, gi) => (
                    <GroupCard
                      key={gi}
                      group={group}
                      groupNumber={gi + 1}
                      habitat={current.habitat}
                    />
                  ))}
                </Stack>
              </>
            ) : null}
          </Container>
        </>
      )}

      {/* Pokédex page */}
      {page === 'pokedex' && (
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {mode === 'standard' ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary" mb={1}>
                Pokédex selection is only available in <strong>Custom</strong> mode.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => setMode('custom')}
                sx={{ mt: 1 }}
              >
                Switch to Custom mode
              </Button>
            </Box>
          ) : (
            <PokedexPage pokemon={includeEvents ? allPokemon : standardPokemon} />
          )}
        </Container>
      )}

      {/* Reset confirm dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset to defaults?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will switch back to Standard mode, re-enable Events, and mark all Pokémon as
            unlocked. Your current custom selection will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReset} color="warning" variant="contained">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function NavLink({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        py: 1.25,
        px: 0,
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: active ? 'text.primary' : 'text.secondary',
        borderBottom: active ? '2px solid #1976d2' : '2px solid transparent',
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.15s',
        '&:hover': { color: 'text.primary' },
      }}
    >
      {children}
    </Box>
  )
}

function GroupCard({
  group,
  groupNumber,
  habitat,
}: {
  group: Pokemon[]
  groupNumber: number
  habitat: Habitat
}) {
  const colors = habitatColors[habitat]
  const score = groupScore(group)
  const allFavs = group.flatMap((p) => p.favorites)
  const favCounts = allFavs.reduce<Record<string, number>>((acc, f) => {
    acc[f] = (acc[f] ?? 0) + 1
    return acc
  }, {})
  const sharedFavs = Object.entries(favCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])

  const isEvent = (p: Pokemon) => p.id.startsWith('e')

  return (
    <Paper
      variant="outlined"
      sx={{ borderColor: colors.border, borderRadius: 2, overflow: 'hidden' }}
    >
      <Box
        sx={{
          bgcolor: colors.bg,
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color={colors.text}>
          Group {groupNumber}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {sharedFavs.slice(0, 3).map(([fav, count]) => (
            <Chip
              key={fav}
              label={`${fav} ×${count}`}
              size="small"
              sx={{
                bgcolor: 'white',
                fontSize: 11,
                height: 20,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            />
          ))}
          <Chip
            label={`score ${score}`}
            size="small"
            sx={{ bgcolor: colors.border, color: 'white', fontSize: 11, height: 20 }}
          />
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {group.map((pokemon, pi) => (
          <Box
            key={pokemon.id}
            sx={{
              flex: '1 1 220px',
              p: 1.5,
              borderRight: pi < group.length - 1 ? '1px solid #f0f0f0' : 'none',
              minWidth: 0,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="baseline" mb={0.5}>
              <Typography variant="body2" color="text.disabled" sx={{ fontSize: 11, minWidth: 32 }}>
                #{pokemon.dexNumber}
              </Typography>
              <Typography variant="body2" fontWeight={600} noWrap>
                {pokemon.name}
              </Typography>
              {isEvent(pokemon) && (
                <Chip
                  label="Event"
                  size="small"
                  sx={{ height: 16, fontSize: 9, bgcolor: '#f3e5f5', color: '#7b1fa2', ml: 0.5 }}
                />
              )}
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {pokemon.favorites.map((fav) => {
                const isShared = (favCounts[fav] ?? 0) >= 2
                return (
                  <Chip
                    key={fav}
                    label={fav}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      bgcolor: isShared ? colors.bg : '#f5f5f5',
                      color: isShared ? colors.text : 'text.secondary',
                      fontWeight: isShared ? 600 : 400,
                      border: isShared ? `1px solid ${colors.border}` : 'none',
                    }}
                  />
                )
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
