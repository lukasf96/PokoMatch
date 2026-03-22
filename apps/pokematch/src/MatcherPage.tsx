import { useMemo } from 'react'
import { allPokemon, standardPokemon } from './pokemon'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { habitatColors, habitatEmoji } from './habitatColors'
import { computeHabitatGroups } from './matching'
import GroupCard from './GroupCard'
import { useStore } from './store'

export default function MatcherPage() {
  const mode = useStore((s) => s.mode)
  const includeEvents = useStore((s) => s.includeEvents)
  const unlockedIds = useStore((s) => s.unlockedIds)

  const activePokemon = useMemo(() => {
    const base = includeEvents ? allPokemon : standardPokemon
    if (mode !== 'custom') return base
    return base.filter((p) => unlockedIds.has(p.id))
  }, [mode, includeEvents, unlockedIds])
  const habitatGroups = useMemo(() => computeHabitatGroups(activePokemon), [activePokemon])

  if (activePokemon.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary" mb={1}>
          No Pokémon available with current settings.
        </Typography>
        {mode === 'custom' && (
          <Typography variant="body2" color="text.secondary">
            Go to Pokédex and unlock some Pokémon first.
          </Typography>
        )}
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={1.5}>
        {habitatGroups.map((hg) => {
          const colors = habitatColors[hg.habitat]
          return (
            <Accordion key={hg.habitat} defaultExpanded variant="outlined" sx={{ borderColor: colors.border, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ bgcolor: colors.bg, borderRadius: 'inherit', minHeight: 48, '&.Mui-expanded': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{habitatEmoji[hg.habitat]}</Typography>
                  <Typography fontWeight={700} color={colors.text}>
                    {hg.habitat}
                  </Typography>
                  <Chip
                    label={`${hg.pokemon.length} Pokémon`}
                    size="small"
                    sx={{ height: 20, fontSize: 11, bgcolor: 'white', color: colors.text, border: `1px solid ${colors.border}` }}
                  />
                  <Chip
                    label={`${hg.groups.length} groups`}
                    size="small"
                    sx={{ height: 20, fontSize: 11, bgcolor: colors.border, color: 'white' }}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {hg.groups.map((group, gi) => (
                    <GroupCard
                      key={gi}
                      group={group}
                      groupNumber={gi + 1}
                      habitat={hg.habitat}
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Stack>
    </Container>
  )
}
