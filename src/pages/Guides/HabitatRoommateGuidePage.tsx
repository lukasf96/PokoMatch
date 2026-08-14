import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Button, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { appRoutes } from "../../router/routes";
import { GuideGroupExample } from "./GuideGroupExample";

export default function HabitatRoommateGuidePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack spacing={{ xs: 4, sm: 6 }}>
        <header>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
            Practical planning guide
          </Typography>
          <Typography component="h1" variant="h3" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: "-0.04em" }}>
            Pokopia habitats and roommates: a simple way to plan a happy home
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 720, fontSize: { sm: "1.1rem" } }}>
            A good household is not just four Pokémon with a similar vibe. Start with the environment they need, then use their shared favorites to decide who earns a room together. That keeps decorating focused instead of turning every home into a compromise.
          </Typography>
        </header>

        <Stack component="section" spacing={2}>
          <Typography component="h2" variant="h5">The order that avoids expensive rework</Typography>
          <Typography variant="body1" color="text.secondary">
            Treat habitat fit as the non-negotiable first filter. Bright and Dark conflict, as do Warm and Cool, and Humid and Dry. A group can still have favorite overlap on paper, but opposing habitat needs mean the room itself is working against someone.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Once the environment works, look for repeated favorites across the group. Shared favorites make it easier for a small set of furniture and decorations to pull their weight. Finally, let the house’s job break ties: a garden crew belongs near growing work, while a material crew is most useful close to the workshop.
          </Typography>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: "background.paper" }}>
            <Typography variant="subtitle1">A quick test before you move anyone in</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Can the room support every resident’s ideal habitat? Do at least a few favorites repeat? If both answers are yes, it is a strong candidate. Use the Match Maker to compare the alternatives rather than trying to memorise every list.
            </Typography>
          </Paper>
        </Stack>

        <Divider />

        <Stack component="section" spacing={2.25}>
          <Typography component="h2" variant="h5">Worked example: a bright chop house</Typography>
          <Typography variant="body1" color="text.secondary">
            This is a useful model for a house that does more than store roommates. Scyther, Scizor, Pinsir, and Heracross all favor a Bright habitat and share the Chop specialty. The card below surfaces their favorite overlap and gives you a concrete starting point for a nearby timber-processing or crafting area.
          </Typography>
          <GuideGroupExample
            title="Bright chop crew"
            pokemonIds={["042", "043", "044", "050"]}
          >
            The Match Maker score is a comparison aid, not a promise that this is the only good room. It is especially useful here because the whole group can live in one Bright setting while serving the same practical area.
          </GuideGroupExample>
        </Stack>

        <Stack component="section" spacing={2}>
          <Typography component="h2" variant="h5">Roommates do not have to share a specialty</Typography>
          <Typography variant="body1" color="text.secondary">
            Specialties are a good way to give a neighborhood a purpose, but they should not override compatibility. A mixed group with the right habitat and several shared favorites is usually easier to decorate than a “perfect” work team that needs conflicting conditions. If you are making a characterful home rather than a production corner, favor the environment and the items first.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is also why small iterations are kinder to your island: settle one good group, decorate it, and only then decide whether the next Pokémon improves that room or deserves a different one.
          </Typography>
        </Stack>

        <Paper component="aside" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: "action.hover" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6">Try your own collection</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Select the Pokémon you have unlocked and compare compatible groups in seconds.
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
