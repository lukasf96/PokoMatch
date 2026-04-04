import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import CatchingPokemonOutlinedIcon from "@mui/icons-material/CatchingPokemonOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { appRoutes } from "../../router/routes";

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Pokopia Habitat Planner & Match‑Maker
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth="sm">
            Plan Pokopia habitats with roommates who actually click
          </Typography>
          <Box sx={{ pt: 0.5 }}>
            <Button
              startIcon={<AutoFixHighOutlinedIcon />}
              component={RouterLink}
              to={appRoutes.matchmaker}
              variant="contained"
              size="large"
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              Open Match-Maker
            </Button>
          </Box>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: 2,
            bgcolor: "action.hover",
            borderColor: "divider",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={700} component="p">
              Plan Pokopia habitats with roommates who actually click
            </Typography>
            <Typography variant="body2" color="text.secondary" component="p">
              Habitat planning in Pokopia means finding the right roommates.
              With a growing Pokédex and specific habitat needs, spotting the
              perfect fit for a full house of four can be a challenge.
            </Typography>
            <Typography variant="body2" color="text.secondary" component="p">
              PokoMatch is your shortcut: we find the Pokémon that love living
              together so you can spend less time guessing and more time
              building. Everything updates instantly as your Pokédex or groups
              change.
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoFixHighOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Automated matching
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Find perfect roommate groups based on shared likes and
                      habitat fit.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SaveOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Always Saved
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your groups and choices are kept right here locally, no
                      account needed.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CatchingPokemonOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Your Collection
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only matches with Pokémon you've unlocked in your Pokédex.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <TipsAndUpdatesOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      Smart Suggestions
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get smart suggestions on who to add to your groups next.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
