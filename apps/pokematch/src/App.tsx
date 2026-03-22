import { useMemo, useState } from 'react'
import { useStore } from './store'
import { allPokemon, standardPokemon } from './pokemon'
import Layout from './Layout'
import MatcherPage from './MatcherPage'
import OverviewPage from './OverviewPage'
import PokedexPage from './PokedexPage'

type Page = 'matcher' | 'overview' | 'pokedex'

export default function App() {
  const includeEvents = useStore((s) => s.includeEvents)

  const activePokemonCount = useStore((s) => {
    const base = s.includeEvents ? allPokemon : standardPokemon
    if (s.mode !== 'custom') return base.length
    return base.reduce((acc, p) => acc + (s.unlockedIds.has(p.id) ? 1 : 0), 0)
  })

  const customUnlockedCount = useStore((s) =>
    allPokemon.reduce((acc, p) => acc + (s.unlockedIds.has(p.id) ? 1 : 0), 0),
  )

  const [page, setPage] = useState<Page>('matcher')

  const pokedexList = useMemo(
    () => (includeEvents ? allPokemon : standardPokemon),
    [includeEvents],
  )

  return (
    <Layout
      activePokemonCount={activePokemonCount}
      customUnlockedCount={customUnlockedCount}
      page={page}
      onPageChange={setPage}
    >
      {page === 'matcher' && <MatcherPage />}

      {page === 'overview' && <OverviewPage />}

      {page === 'pokedex' && <PokedexPage pokemon={pokedexList} />}
    </Layout>
  )
}
