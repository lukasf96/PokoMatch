import {
  AutoFixHighOutlined,
  CatchingPokemonOutlined,
  DashboardOutlined,
  HomeOutlined,
} from "@mui/icons-material";
import { Box, Chip } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { LayoutSettingsMenu } from "./components/layout-settings-menu/LayoutSettingsMenu";
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
  const isHomeActive = pathname === appRoutes.home;
  const isMatchMakerActive = pathname === appRoutes.matchmaker;
  const isInsightsActive = pathname === appRoutes.insights;
  const isPokedexActive = pathname === appRoutes.pokedex;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          boxShadow: "0 1px 0 0 rgb(15 23 42 / 0.04)",
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1, sm: 1.5 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        <Box
          component={RouterLink}
          to={appRoutes.home}
          sx={{
            display: "block",
            lineHeight: 0,
            flexShrink: 0,
            alignSelf: { xs: "center", sm: "flex-start" },
          }}
        >
          <Box
            component="img"
            src="/logo/logo.png"
            alt="PokoMatch logo"
            sx={{
              height: { xs: 32, sm: 40 },
              width: "auto",
              display: "block",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            alignItems: "center",
            justifyContent: { xs: "center", sm: "flex-start" },
            gap: { xs: 0.5, sm: 0.75 },
            minWidth: 0,
            width: { xs: "100%", sm: "auto" },
            ml: { xs: 0, sm: "auto" },
            pb: { xs: 0, sm: 0.25 },
          }}
        >
          <NavItem
            active={isHomeActive}
            to={appRoutes.home}
            icon={<HomeOutlined fontSize="inherit" />}
          >
            Home
          </NavItem>
          <NavItem
            active={isMatchMakerActive}
            to={appRoutes.matchmaker}
            icon={<AutoFixHighOutlined fontSize="inherit" />}
          >
            Match-Maker
          </NavItem>
          <NavItem
            active={isInsightsActive}
            to={appRoutes.insights}
            icon={<DashboardOutlined fontSize="inherit" />}
          >
            Insights
          </NavItem>
          <NavItem
            active={isPokedexActive}
            to={appRoutes.pokedex}
            icon={<CatchingPokemonOutlined fontSize="inherit" />}
          >
            Pokédex
            <Chip
              label={`${unlockedCount}/${TOTAL_POKEMON}`}
              size="small"
              sx={{ ml: 0.75, height: 16, fontSize: 10 }}
            />
          </NavItem>
          <LayoutSettingsMenu />
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
  children,
}: {
  active: boolean;
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        textDecoration: "none",
        cursor: "pointer",
        py: { xs: 0.5, sm: 0.5 },
        px: { xs: 0.65, sm: 1 },
        fontSize: { xs: 12, sm: 13 },
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
