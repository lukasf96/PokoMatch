import { Box, Stack, Typography } from "@mui/material";
import { allPokemon } from "../../services/pokemon";
import { getDisplayHabitat } from "../MatchMaker/group-helpers";
import GroupCard from "../MatchMaker/components/GroupCard";

interface GuideGroupExampleProps {
  pokemonIds: string[];
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}

function getPokemon(ids: string[]) {
  return ids.map((id) => {
    const pokemon = allPokemon.find((entry) => entry.id === id);
    if (!pokemon) throw new Error(`Guide example references missing Pokémon: ${id}`);
    return pokemon;
  });
}

/** A deliberately read-only Match Maker card for explaining a real group. */
export function GuideGroupExample({
  pokemonIds,
  title,
  eyebrow = "Example group",
  children,
}: GuideGroupExampleProps) {
  const group = getPokemon(pokemonIds);

  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Stack spacing={0.75} sx={{ mb: 1.25 }}>
        <Typography
          variant="overline"
          sx={{ color: "primary.main", fontWeight: 800, lineHeight: 1.2 }}
        >
          {eyebrow}
        </Typography>
        <Typography component="h3" variant="h6">
          {title}
        </Typography>
        <Typography component="figcaption" variant="body2" color="text.secondary">
          {children}
        </Typography>
      </Stack>
      <Box
        aria-label={`${title} example group`}
        sx={{ pointerEvents: "none", "& *": { pointerEvents: "none" } }}
      >
        <GroupCard
          group={group}
          groupNumber={1}
          habitat={getDisplayHabitat(group)}
        />
      </Box>
    </Box>
  );
}
