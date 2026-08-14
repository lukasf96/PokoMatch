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
            A factory is a practical setup that places useful specialties close to the work they support. The same roommate rules still matter: build around groups that can share a habitat comfortably, then give that neighborhood a useful job.
          </Typography>
        </header>

        <Stack component="section" spacing={2}>
          <Typography component="h2" variant="h5">Plan the job, then the household</Typography>
          <Typography variant="body1" color="text.secondary">
            A real factory is a small production chain, not merely a room full of Pokémon with the same label. Start with the material you want, then work backwards: one Pokémon produces it, another moves it into a Community Box, and a third converts it. Check that the workers can still live together before you build around the chain.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep the factory idea flexible. One Pokémon can cover more than one step, so a productive setup does not have to fill all four beds. A dedicated work corner can be a pair in one prefab house, or a few compatible homes arranged around the same Community Box.
          </Typography>
        </Stack>

        <Divider />

        <Stack component="section" spacing={2.25}>
          <Typography component="h2" variant="h5">Worked example: a brick-factory household</Typography>
          <Typography variant="body1" color="text.secondary">
            Trapinch litters Squishy Clay near its home. Rolycoly, Carkol, and Coalossal each have both Gather and Burn, so the coal line can pick that clay up, move it into a nearby Community Box, and convert it into Bricks. This is the useful kind of specialty pairing: the residents perform connected jobs instead of merely duplicating one label.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            It is also a much stronger roommate group than the simple Trapinch–Rolycoly pair. The coal-line trio shares all five of its favorites with one another, and Trapinch shares Hard stuff with each of them. Trapinch prefers Dry and the coal line prefers Warm, which are not opposing habitats. Put the Community Box directly beside their house or within the area they regularly walk through. Player reports suggest the automation is opportunistic rather than instant, so keep the residents fed and do not expect every dropped piece of clay to be collected immediately.
          </Typography>
          <GuideGroupExample
            title="Trapinch + coal-line brick factory"
            pokemonIds={["237", "193", "194", "195"]}
          >
            A strong-fit factory group: Squishy Clay → Gather → Community Box → Burn → Bricks, with a group score of 18.
          </GuideGroupExample>
        </Stack>

        <Stack component="section" spacing={2.25}>
          <Typography component="h2" variant="h5">A factory can also be a focused household</Typography>
          <Typography variant="body1" color="text.secondary">
            Not every useful setup needs a multi-step chain. A garden crew can be a good way to keep growing work close to the habitat it supports, as long as it is genuinely comfortable for the residents.
          </Typography>
          <GuideGroupExample
            title="Humid garden crew"
            pokemonIds={["015", "021", "022", "023"]}
          >
            The shared Humid setting makes this a coherent household; the Grow specialty gives that household a practical reason to live beside a cultivated corner.
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
