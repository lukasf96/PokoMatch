import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../Layout";
import MatcherPage from "../pages/MatchMaker/MatcherPage";
import OverviewPage from "../pages/Overview/OverviewPage";
import PokedexPage from "../pages/Pokedex/PokedexPage";
import { allPokemon } from "../services/pokemon";
import { useStore } from "../store/store";

const appRoutes = {
  matchmaker: "/matchmaker",
  overview: "/overview",
  pokedex: "/pokedex",
} as const;

export default function AppRouter() {
  const unlockedCount = useStore((s) =>
    allPokemon.reduce((acc, p) => acc + (s.unlockedIds.has(p.id) ? 1 : 0), 0),
  );

  return (
    <BrowserRouter>
      <Layout
        unlockedCount={unlockedCount}
        matchMakerPath={appRoutes.matchmaker}
        overviewPath={appRoutes.overview}
        pokedexPath={appRoutes.pokedex}
      >
        <Routes>
          <Route
            path="/"
            element={<Navigate to={appRoutes.matchmaker} replace />}
          />
          <Route path={appRoutes.matchmaker} element={<MatcherPage />} />
          <Route path={appRoutes.overview} element={<OverviewPage />} />
          <Route path={appRoutes.pokedex} element={<PokedexPage />} />
          <Route
            path="*"
            element={<Navigate to={appRoutes.matchmaker} replace />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
