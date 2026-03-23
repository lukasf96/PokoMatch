import {
  Box,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { allPokemon } from "./pokemon";
import { useStore } from "./store";

type Page = "matcher" | "overview" | "pokedex";

interface Props {
  activePokemonCount: number;
  customUnlockedCount: number;
  page: Page;
  onPageChange: (page: Page) => void;
  children: React.ReactNode;
}

export default function Layout({
  activePokemonCount,
  customUnlockedCount,
  page,
  onPageChange,
  children,
}: Props) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);

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
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
          >
            <ToggleButton value="standard">Standard</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
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
          <NavLink
            active={page === "matcher"}
            onClick={() => onPageChange("matcher")}
          >
            Match-Maker
          </NavLink>
          <NavLink
            active={page === "overview"}
            onClick={() => onPageChange("overview")}
          >
            Overview
          </NavLink>
          <NavLink
            active={page === "pokedex"}
            onClick={() => onPageChange("pokedex")}
          >
            Pokédex
            <Chip
              label={
                mode === "custom"
                  ? `${customUnlockedCount}/${allPokemon.length}`
                  : `${allPokemon.length}`
              }
              size="small"
              sx={{ ml: 0.75, height: 16, fontSize: 10 }}
            />
          </NavLink>
        </Stack>
      </Box>

      {children}
    </Box>
  );
}

function NavLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
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
