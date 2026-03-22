import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import type { Pokemon, Habitat } from './types'
import { habitatColors } from './habitatColors'
import { groupScore } from './matching'

export default function GroupCard({
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
