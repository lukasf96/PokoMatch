import { useMemo, useState } from 'react'
import { useStore } from './store'
import { allPokemon, standardPokemon } from './pokemon'
import Layout from './Layout'
import MatcherPage from './MatcherPage'
import OverviewPage from './OverviewPage'
import PokedexPage from './PokedexPage'

type Page = 'matcher' | 'overview' | 'pokedex'

export default function App() {
  const { mode, includeEvents, unlockedIds } = useStore()
  const [page, setPage] = useState<Page>('matcher')

  const activePokemon = useMemo(() => {
    const base = includeEvents ? allPokemon : standardPokemon
    if (mode === 'custom') return base.filter((p) => unlockedIds.has(p.id))
    return base
  }, [mode, includeEvents, unlockedIds])

  const customUnlockedCount = useMemo(
    () => allPokemon.filter((p) => unlockedIds.has(p.id)).length,
    [unlockedIds],
  )

  return (
    <Layout
      activePokemonCount={activePokemon.length}
      customUnlockedCount={customUnlockedCount}
      page={page}
      onPageChange={setPage}
    >
      {page === 'matcher' && <MatcherPage activePokemon={activePokemon} />}

      {page === 'overview' && <OverviewPage />}

      {page === 'pokedex' && (
        <PokedexPage pokemon={includeEvents ? allPokemon : standardPokemon} />
      )}
    </Layout>
  )
}
