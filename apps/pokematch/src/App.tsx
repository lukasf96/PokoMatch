import { useMemo, useState } from 'react'
import {
  Box,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import rawData from './pokedex.json'
import type { Pokemon, Habitat } from './types'
import { computeHabitatGroups } from './matching'
import { groupScore } from './matching'
import { habitatColors, habitatEmoji } from './habitatColors'
import OverviewTab from './OverviewTab'

const allPokemon: Pokemon[] = [
  ...(rawData.standard as Pokemon[]),
  ...(rawData.event as Pokemon[]),
]

// Tab index 0 = Overview, 1..N = habitats
const OVERVIEW_TAB = 0

export default function App() {
  const habitatGroups = useMemo(() => computeHabitatGroups(allPokemon), [])
  const [activeTab, setActiveTab] = useState(0)

  const isOverview = activeTab === OVERVIEW_TAB
  const habitatIndex = activeTab - 1
  const current = isOverview ? null : habitatGroups[habitatIndex]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0', px: 3, py: 2 }}>
        <Typography variant="h5" fontWeight={700} letterSpacing={-0.5}>
          Pokopia Match-Maker
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {allPokemon.length} Pokémon grouped by ideal habitat &amp; shared favorites
        </Typography>
      </Box>

      {/* Tabs */}
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
                      bgcolor: activeTab === i + 1 ? habitatColors[hg.habitat].bg : undefined,
                    }}
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {isOverview ? (
          <OverviewTab pokemon={allPokemon} />
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
