import CatchingPokemonOutlinedIcon from "@mui/icons-material/CatchingPokemonOutlined";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { appRoutes } from "../../router/routes";

export function BubblyBasinBanner() {
  return (
    <Box
      component="aside"
      aria-label="Bubbly Basin expansion support"
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";
        const teal = theme.palette.secondary.main;
        const cyan = theme.palette.info.main;
        return {
          width: "100%",
          borderBottom: 1,
          borderColor: "divider",
          backgroundImage: isDark
            ? `linear-gradient(
                105deg,
                ${alpha(cyan, 0.18)} 0%,
                ${alpha(teal, 0.14)} 45%,
                ${alpha(theme.palette.primary.main, 0.1)} 100%
              )`
            : `linear-gradient(
                105deg,
                ${alpha(cyan, 0.12)} 0%,
                ${alpha(teal, 0.1)} 50%,
                ${alpha("#bae6fd", 0.35)} 100%
              )`,
          backgroundColor: isDark
            ? alpha(theme.palette.background.paper, 0.65)
            : alpha("#ffffff", 0.55),
        };
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 1.75 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.25, sm: 2.5 }}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ alignItems: "center", minWidth: 0 }}
          >
            <Box
              component="img"
              src="/images/bubbly-basin-logo.webp"
              alt="Bubbly Basin"
              sx={{
                height: { xs: 44, sm: 56, md: 64 },
                width: "auto",
                maxWidth: { xs: "46%", sm: 220, md: 260 },
                objectFit: "contain",
                flexShrink: 0,
                display: "block",
                filter: (theme) =>
                  theme.palette.mode === "dark"
                    ? "drop-shadow(0 1px 2px rgba(0,0,0,0.45))"
                    : "drop-shadow(0 1px 1px rgba(15,23,42,0.12))",
              }}
            />
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.25,
                }}
              >
                Now with Bubbly Basin support
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.35,
                  maxWidth: 420,
                }}
              >
                PokoMatch has been updated for the Bubbly Basin expansion.
                (Re-)Plan your habitats with all the new Pokémon!
              </Typography>
            </Stack>
          </Stack>

          <Button
            component={RouterLink}
            to={appRoutes.pokedex}
            variant="outlined"
            size="small"
            startIcon={<CatchingPokemonOutlinedIcon />}
            sx={(theme) => {
              const isDark = theme.palette.mode === "dark";
              return {
                flexShrink: 0,
                alignSelf: { xs: "stretch", sm: "center" },
                borderColor: alpha(
                  theme.palette.secondary.main,
                  isDark ? 0.5 : 0.35,
                ),
                color: isDark
                  ? theme.palette.secondary.light
                  : theme.palette.secondary.dark,
                bgcolor: alpha(
                  theme.palette.secondary.main,
                  isDark ? 0.12 : 0.08,
                ),
                "&:hover": {
                  borderColor: theme.palette.secondary.main,
                  bgcolor: alpha(
                    theme.palette.secondary.main,
                    isDark ? 0.2 : 0.14,
                  ),
                },
              };
            }}
          >
            Browse Basin Pokédex
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
