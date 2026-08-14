import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Button, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { appRoutes } from "../../router/routes";
import { GuideGroupExample } from "./GuideGroupExample";

export default function SpecialtyGroupsGuidePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack spacing={{ xs: 4, sm: 6 }}>
        <header>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
            Practical planning guide
          </Typography>
          <Typography component="h1" variant="h3" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: "-0.04em" }}>
            Pokopia specialty groups: build a factory district without sacrificing comfort
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 720, fontSize: { sm: "1.1rem" } }}>
            “Factory” is a player shorthand for putting useful specialties near the work they support. It is not a separate game system: the same roommate rules still matter. The trick is to make a useful neighborhood from groups that can actually share a habitat.
          </Typography>
        </header>

        <Stack component="section" spacing={2}>
          <Typography component="h2" variant="h5">Plan the job, then the household</Typography>
          <Typography variant="body1" color="text.secondary">
            Pick a task you want nearby—wood, heat, water, growing, or power—and find a compact group with that specialty. Check its habitat before you build around it. A dedicated work corner is most pleasant when its residents also share decorations, rather than merely standing close to the same machine.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep the factory idea flexible. A specialty group can be a four-Pokémon house beside a workshop, or a few compatible homes along a garden path. Let the layout serve your island instead of forcing every worker into one building.
          </Typography>
        </Stack>

        <Divider />

        <Stack component="section" spacing={2.25}>
          <Typography component="h2" variant="h5">Example: the warm kiln crew</Typography>
          <Typography variant="body1" color="text.secondary">
            Torkoal, Rolycoly, Carkol, and Coalossal are a tidy starting group for a warm industrial corner. They share the Burn specialty, so they make thematic neighbors for a furnace or cooking area, and their shared habitat lets the room’s main environmental choice benefit everybody.
          </Typography>
          <GuideGroupExample
            title="Warm kiln crew"
            pokemonIds={["176", "193", "194", "195"]}
          >
            This group is intentionally cohesive rather than maximally diverse. Use it as a dependable base camp for a fire- or stone-themed work area, then place more specialised Pokémon in nearby compatible homes.
          </GuideGroupExample>
        </Stack>

        <Stack component="section" spacing={2.25}>
          <Typography component="h2" variant="h5">Example: a humid growing corner</Typography>
          <Typography variant="body1" color="text.secondary">
            A garden factory can be quieter and more decorative. Vileplume, Bellsprout, Weepinbell, and Victreebel share both a Humid ideal habitat and the Grow specialty. Their overlap gives you a focused reason to build a lush, plant-heavy home instead of scattering the garden helpers across incompatible terrain.
          </Typography>
          <GuideGroupExample
            title="Humid garden crew"
            pokemonIds={["015", "021", "022", "023"]}
          >
            Repeated Grow labels are useful, but the real win is that the same humid setting and a few well-chosen favorites can support the whole household.
          </GuideGroupExample>
        </Stack>

        <Stack component="section" spacing={2}>
          <Typography component="h2" variant="h5">When a factory group is not worth it</Typography>
          <Typography variant="body1" color="text.secondary">
            Do not force it just because two Pokémon have the same specialty. If their ideal habitats oppose each other, split the job across separate homes. You can still keep those homes near the same resource route, preserving the practical benefit while allowing each resident to be comfortable.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The best factory districts feel like neighborhoods first: compatible rooms, a clear nearby task, and enough open space for the rest of your island to remain expressive.
          </Typography>
        </Stack>

        <Paper component="aside" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: "action.hover" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6">Find groups around your own specialties</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Use the Match Maker’s suggested groups as a starting point, then choose the homes that fit your build.
              </Typography>
            </Box>
            <Button component={RouterLink} to={appRoutes.matchmaker} variant="contained" endIcon={<ArrowForwardIcon />} sx={{ flexShrink: 0 }}>
              Open Match Maker
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
