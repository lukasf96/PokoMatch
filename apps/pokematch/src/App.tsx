import { useState } from "react";
import Layout from "./Layout";
import MatcherPage from "./pages/MatchMaker/MatcherPage";
import OverviewPage from "./pages/Overview/OverviewPage";
import PokedexPage from "./pages/Pokedex/PokedexPage";
import { allPokemon } from "./services/pokemon";
import { useStore } from "./store/store";

type Page = "matcher" | "overview" | "pokedex";

export default function App() {
  const unlockedCount = useStore((s) =>
    allPokemon.reduce((acc, p) => acc + (s.unlockedIds.has(p.id) ? 1 : 0), 0),
  );

  const [page, setPage] = useState<Page>("matcher");

  return (
    <Layout unlockedCount={unlockedCount} page={page} onPageChange={setPage}>
      {page === "matcher" && <MatcherPage />}

      {page === "overview" && <OverviewPage />}

      {page === "pokedex" && <PokedexPage />}
    </Layout>
  );
}
