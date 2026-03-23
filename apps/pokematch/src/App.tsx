import { useState } from "react";
import Layout from "./Layout";
import MatcherPage from "./MatcherPage";
import OverviewPage from "./OverviewPage";
import PokedexPage from "./PokedexPage";
import { allPokemon } from "./pokemon";
import { useStore } from "./store";

type Page = "matcher" | "overview" | "pokedex";

export default function App() {
  const unlockedCount = useStore((s) =>
    allPokemon.reduce((acc, p) => acc + (s.unlockedIds.has(p.id) ? 1 : 0), 0),
  );

  const [page, setPage] = useState<Page>("matcher");

  return (
    <Layout
      unlockedCount={unlockedCount}
      page={page}
      onPageChange={setPage}
    >
      {page === "matcher" && <MatcherPage />}

      {page === "overview" && <OverviewPage />}

      {page === "pokedex" && <PokedexPage />}
    </Layout>
  );
}
