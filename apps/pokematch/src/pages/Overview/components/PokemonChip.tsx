import { Chip } from "@mui/material";
import type { Pokemon } from "../../../types/types";

interface PokemonChipProps {
  pokemon: Pokemon;
}

function isEventPokemon(pokemon: Pokemon): boolean {
  return pokemon.id.startsWith("e");
}

export function PokemonChip({ pokemon }: PokemonChipProps) {
  const isEvent = isEventPokemon(pokemon);

  return (
    <Chip
      key={pokemon.id}
      label={`#${pokemon.dexNumber} ${pokemon.name}${isEvent ? " ★" : ""}`}
      size="small"
      sx={{
        height: 20,
        fontSize: 10,
        bgcolor: isEvent ? "secondary.light" : undefined,
        color: isEvent ? "secondary.dark" : undefined,
      }}
    />
  );
}
