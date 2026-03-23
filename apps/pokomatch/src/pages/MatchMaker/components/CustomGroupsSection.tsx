import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SuggestedPokemon } from "../../../services/matching.service";
import { getPokemonDisplayName } from "../../../services/pokemon-localization";
import { useStore } from "../../../store/store";
import type { Habitat, Pokemon } from "../../../types/types";
import GroupCard from "./GroupCard";

interface CustomGroupsSectionProps {
  customGroups: Pokemon[][];
  suggestions: SuggestedPokemon[][];
  availablePokemon: Pokemon[];
  onAddGroup: () => void;
  onDeleteGroup: (groupIndex: number) => void;
  onAddPokemon: (groupIndex: number, pokemonId: string) => void;
  onRemovePokemon: (groupIndex: number, pokemonId: string) => void;
}

function groupStableKey(group: { id: string }[]): string {
  return group.map((p) => p.id).join("|");
}

function getDisplayHabitat(group: Pokemon[]): Habitat {
  if (group.length === 0) return "Cool";
  const counts = group.reduce<Record<Habitat, number>>(
    (acc, pokemon) => {
      acc[pokemon.idealHabitat] += 1;
      return acc;
    },
    { Bright: 0, Cool: 0, Dark: 0, Dry: 0, Humid: 0, Warm: 0 },
  );
  const habitatOrder: Habitat[] = [
    "Bright",
    "Cool",
    "Dark",
    "Dry",
    "Humid",
    "Warm",
  ];
  return habitatOrder.reduce(
    (bestHabitat, habitat) =>
      counts[habitat] > counts[bestHabitat] ? habitat : bestHabitat,
    habitatOrder[0],
  );
}

export function CustomGroupsSection({
  customGroups,
  suggestions,
  availablePokemon,
  onAddGroup,
  onDeleteGroup,
  onAddPokemon,
  onRemovePokemon,
}: CustomGroupsSectionProps) {
  const nameLanguage = useStore((state) => state.nameLanguage);

  return (
    <Accordion
      defaultExpanded
      elevation={0}
      sx={{ borderRadius: 1, overflow: "hidden" }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon aria-hidden />}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Typography component="span" fontWeight={700}>
            My Groups
          </Typography>
          <Chip label={`${customGroups.length} groups`} size="small" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Button
            onClick={onAddGroup}
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          >
            Add group
          </Button>

          {customGroups.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Add your habitats you have already setup in-game.
            </Typography>
          )}

          {customGroups.map((group, gi) => {
            const groupIds = new Set(group.map((member) => member.id));
            const groupAvailablePokemon = availablePokemon.filter(
              (candidate) => !groupIds.has(candidate.id),
            );
            const groupSuggestions = suggestions[gi] ?? [];
            return (
              <Stack key={`custom-${groupStableKey(group) || gi}`} spacing={1}>
                <GroupCard
                  group={group}
                  groupNumber={gi + 1}
                  habitat={getDisplayHabitat(group)}
                  onRemovePokemon={(pokemonId) => onRemovePokemon(gi, pokemonId)}
                  footerContent={
                    group.length < 4 ? (
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Add Pokemon to Group {gi + 1}
                        </Typography>

                        <Autocomplete
                          options={groupAvailablePokemon}
                          disabled={groupAvailablePokemon.length === 0}
                          getOptionLabel={(option) =>
                            `${getPokemonDisplayName(option, nameLanguage)} (#${option.dexNumber})`
                          }
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Choose Pokemon" />
                          )}
                          onChange={(_, value) => {
                            if (value) onAddPokemon(gi, value.id);
                          }}
                        />

                        {group.length > 0 && groupSuggestions.length > 0 && (
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Suggested next:
                            </Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              {groupSuggestions.map((suggestion) => (
                                <Chip
                                  key={`suggest-${gi}-${suggestion.pokemon.id}`}
                                  label={`${getPokemonDisplayName(
                                    suggestion.pokemon,
                                    nameLanguage,
                                  )} (+${suggestion.score})`}
                                  size="small"
                                  onClick={() => onAddPokemon(gi, suggestion.pokemon.id)}
                                />
                              ))}
                            </Stack>
                          </Stack>
                        )}
                      </Stack>
                    ) : null
                  }
                  groupAction={{
                    ariaLabel: `Delete my group ${gi + 1}`,
                    onClick: () => onDeleteGroup(gi),
                    kind: "remove",
                  }}
                />
              </Stack>
            );
          })}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
