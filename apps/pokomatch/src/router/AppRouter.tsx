import { Navigate, Route, Routes } from "react-router-dom";
import MatcherPage from "../pages/MatchMaker/MatcherPage";
import InsightsPage from "../pages/Insights/InsightsPage";
import PokedexPage from "../pages/Pokedex/PokedexPage";
import { appRoutes } from "./routes";

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={appRoutes.matchmaker} replace />}
      />
      <Route path={appRoutes.matchmaker} element={<MatcherPage />} />
      <Route path={appRoutes.insights} element={<InsightsPage />} />
      <Route path={appRoutes.pokedex} element={<PokedexPage />} />
      <Route
        path="*"
        element={<Navigate to={appRoutes.matchmaker} replace />}
      />
    </Routes>
  );
}
