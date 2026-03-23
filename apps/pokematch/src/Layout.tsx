import { Box, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { allPokemon } from "./services/pokemon";

interface Props {
  unlockedCount: number;
  matchMakerPath: string;
  overviewPath: string;
  pokedexPath: string;
  children: React.ReactNode;
}

export default function Layout({
  unlockedCount,
  matchMakerPath,
  overviewPath,
  pokedexPath,
  children,
}: Props) {
  const { pathname } = useLocation();
  const isMatchMakerActive = pathname === matchMakerPath;
  const isOverviewActive = pathname === overviewPath;
  const isPokedexActive = pathname === pokedexPath;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          boxShadow: "0 1px 0 0 rgb(15 23 42 / 0.04)",
          px: 3,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} letterSpacing={-0.5}>
            Pokopia Match-Maker
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        />
      </Box>

      {/* Page nav */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          px: 3,
        }}
      >
        <Stack direction="row" spacing={3}>
          <NavItem active={isMatchMakerActive} to={matchMakerPath}>
            Match-Maker
          </NavItem>
          <NavItem active={isOverviewActive} to={overviewPath}>
            Overview
          </NavItem>
          <NavItem active={isPokedexActive} to={pokedexPath}>
            Pokédex
            <Chip
              label={`${unlockedCount}/${allPokemon.length}`}
              size="small"
              sx={{ ml: 0.75, height: 16, fontSize: 10 }}
            />
          </NavItem>
        </Stack>
      </Box>

      {children}
    </Box>
  );
}

function NavItem({
  active,
  to,
  children,
}: {
  active: boolean;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        textDecoration: "none",
        background: "none",
        border: "none",
        cursor: "pointer",
        py: 1.25,
        px: 0,
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: active ? "text.primary" : "text.secondary",
        borderBottom: "2px solid",
        borderBottomColor: active ? "primary.main" : "transparent",
        display: "flex",
        alignItems: "center",
        transition: "color 0.15s",
        "&:hover": { color: "text.primary" },
      }}
    >
      {children}
    </Box>
  );
}
