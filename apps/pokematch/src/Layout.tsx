import {
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useStore } from './store'
import { allPokemon, eventPokemon } from './pokemon'

type Page = 'matcher' | 'overview' | 'pokedex'

interface Props {
  activePokemonCount: number
  customUnlockedCount: number
  page: Page
  onPageChange: (page: Page) => void
  children: React.ReactNode
}

export default function Layout({
  activePokemonCount,
  customUnlockedCount,
  page,
  onPageChange,
  children,
}: Props) {
  const { mode, setMode, includeEvents, setIncludeEvents } = useStore()

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
            {activePokemonCount} Pokémon active
            {mode === 'custom' && (
              <>
                {' '}
                &middot; {customUnlockedCount} / {allPokemon.length} unlocked
              </>
            )}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
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

          <FormControlLabel
            control={
              <Switch
                checked={includeEvents}
                onChange={(e) => setIncludeEvents(e.target.checked)}
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

        </Stack>
      </Box>

      {/* Page nav */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0', px: 3 }}>
        <Stack direction="row" spacing={3}>
          <NavLink active={page === 'matcher'} onClick={() => onPageChange('matcher')}>
            Match-Maker
          </NavLink>
          <NavLink active={page === 'overview'} onClick={() => onPageChange('overview')}>
            Overview
          </NavLink>
          <NavLink active={page === 'pokedex'} onClick={() => onPageChange('pokedex')}>
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

      {children}
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
