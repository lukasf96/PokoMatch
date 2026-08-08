import {
  AutoFixHighOutlined,
  CatchingPokemonOutlined,
  DashboardOutlined,
  HomeOutlined,
} from "@mui/icons-material";
import { Box, Chip } from "@mui/material";
import { useEffect, useState, useTransition, type MouseEvent } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { LayoutSettingsMenu } from "./components/layout-settings-menu/LayoutSettingsMenu";
import { preloadRoute } from "./router/lazyPages";
import { appRoutes } from "./router/routes";
import { allPokemon } from "./services/pokemon";
import { useStore } from "./store/store";

const TOTAL_POKEMON = allPokemon.length;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const unlockedCount = useStore((s) => s.unlockedIds.size);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  /** Optimistic path so the active nav chip flips on the click frame. */
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  const displayPath = pendingPath ?? pathname;
  const isHomeActive = displayPath === appRoutes.home;
  const isMatchMakerActive = displayPath === appRoutes.matchmaker;
  const isInsightsActive = displayPath === appRoutes.insights;
  const isPokedexActive = displayPath === appRoutes.pokedex;

  // Prefetch the other route chunks during idle time so their first navigation
  // is instant (Match Maker also pulls in the heavier matching code + worker
  // chunk). Hovering/focusing a nav link prefetches on demand too.
  useEffect(() => {
    const targets = [
      appRoutes.matchmaker,
      appRoutes.insights,
      appRoutes.pokedex,
      appRoutes.home,
    ].filter((path) => path !== pathname);
    const prefetch = () => targets.forEach(preloadRoute);
    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      const handle = ric(prefetch);
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(prefetch, 1200);
    return () => window.clearTimeout(handle);
  }, [pathname]);

  const goTo = (to: string) => {
    if (to === pathname) return;
    setPendingPath(to);
    // Defer the route swap so the click paints immediately; during the
    // transition React keeps the previous page visible (no Suspense spinner).
    startTransition(() => {
      navigate(to);
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          boxShadow: "0 1px 0 0 rgb(15 23 42 / 0.04)",
          px: { xs: 1.5, md: 3 },
          py: { xs: 1, md: 1.5 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: { xs: 1, md: 1.5 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: { xs: "100%", md: "auto" },
            flexShrink: 0,
            alignSelf: { xs: "stretch", md: "flex-start" },
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 48,
              minWidth: 48,
              flexShrink: 0,
              display: { xs: "block", md: "none" },
            }}
          />
          <Box
            component={RouterLink}
            to={appRoutes.home}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.altKey ||
                event.ctrlKey ||
                event.shiftKey
              ) {
                return;
              }
              event.preventDefault();
              goTo(appRoutes.home);
            }}
            sx={{
              display: "flex",
              justifyContent: "center",
              lineHeight: 0,
              flex: { xs: 1, md: "none" },
              minWidth: 0,
            }}
          >
            <Box
              component="img"
              src="/logo/logo.png"
              alt="PokoMatch logo"
              sx={{
                height: { xs: 32, md: 40 },
                width: "auto",
                display: "block",
              }}
            />
          </Box>
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              width: 48,
              minWidth: 48,
              flexShrink: 0,
              justifyContent: "flex-end",
            }}
          >
            <LayoutSettingsMenu />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: { xs: "wrap", md: "nowrap" },
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
            gap: { xs: 0.3, md: 0.75 },
            minWidth: 0,
            width: { xs: "100%", md: "auto" },
            ml: { xs: 0, md: "auto" },
            pb: { xs: 0, md: 0.25 },
          }}
        >
          <NavItem
            active={isHomeActive}
            to={appRoutes.home}
            icon={<HomeOutlined fontSize="inherit" />}
            onNavigate={goTo}
          >
            Home
          </NavItem>
          <NavItem
            active={isMatchMakerActive}
            to={appRoutes.matchmaker}
            icon={<AutoFixHighOutlined fontSize="inherit" />}
            onNavigate={goTo}
          >
            Match-Maker
          </NavItem>
          <NavItem
            active={isInsightsActive}
            to={appRoutes.insights}
            icon={<DashboardOutlined fontSize="inherit" />}
            onNavigate={goTo}
          >
            Insights
          </NavItem>
          <NavItem
            active={isPokedexActive}
            to={appRoutes.pokedex}
            icon={<CatchingPokemonOutlined fontSize="inherit" />}
            onNavigate={goTo}
          >
            Pokédex
            <Chip
              label={`${unlockedCount}/${TOTAL_POKEMON}`}
              size="small"
              sx={{
                ml: 0.2,
                height: 16,
                fontSize: 10,
                "& .MuiChip-label": { px: 0.5, py: 0 },
              }}
            />
          </NavItem>
          <Box sx={{ display: { xs: "none", md: "contents" } }}>
            <LayoutSettingsMenu />
          </Box>
        </Box>
      </Box>

      {children}
    </Box>
  );
}

function NavItem({
  active,
  to,
  icon,
  onNavigate,
  children,
}: {
  active: boolean;
  to: string;
  icon: React.ReactNode;
  onNavigate: (to: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      onMouseEnter={() => preloadRoute(to)}
      onFocus={() => preloadRoute(to)}
      onTouchStart={() => preloadRoute(to)}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return;
        }
        event.preventDefault();
        onNavigate(to);
      }}
      sx={{
        textDecoration: "none",
        cursor: "pointer",
        py: 0.5,
        px: { xs: 0.65, md: 1 },
        fontSize: { xs: 12, md: 13 },
        fontWeight: active ? 600 : 500,
        color: active ? "text.primary" : "text.secondary",
        borderRadius: 1,
        bgcolor: active ? "action.selected" : "transparent",
        display: "flex",
        alignItems: "center",
        transition: "background-color 0.15s ease, color 0.15s ease",
        whiteSpace: "nowrap",
        "&:hover": {
          color: "text.primary",
          bgcolor: active ? "action.selected" : "action.hover",
        },
      }}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          mr: 0.75,
          fontSize: 16,
        }}
      >
        {icon}
      </Box>
      {children}
    </Box>
  );
}
