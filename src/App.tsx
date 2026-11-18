import { BrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { preloadRoute } from "./router/lazyPages";
import AppRouter from "./router/AppRouter";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell preloadRoute={preloadRoute}>
        <AppRouter />
      </AppShell>
    </BrowserRouter>
  );
}
