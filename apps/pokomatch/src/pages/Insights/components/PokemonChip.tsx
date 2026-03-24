import { Chip } from "@mui/material";
import { isEventDexPokemon } from "../../../services/pokemon";
import { getPokemonDisplayName } from "../../../services/pokemon-localization";
import { useStore } from "../../../store/store";
import type { Pokemon } from "../../../types/types";

interface PokemonChipProps {
  pokemon: Pokemon;
}

export function PokemonChip({ pokemon }: PokemonChipProps) {
  const isEvent = isEventDexPokemon(pokemon);
  const nameLanguage = useStore((state) => state.nameLanguage);
  const pokemonDisplayName = getPokemonDisplayName(pokemon, nameLanguage);

  return (
    <Chip
      key={pokemon.id}
      label={`#${pokemon.dexNumber} ${pokemonDisplayName}${isEvent ? " ★" : ""}`}
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
