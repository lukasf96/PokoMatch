import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { memo, useCallback } from "react";
import type { SuggestedPokemon } from "../../../services/matching.service";
import type { PokemonNameLanguage } from "../../../services/pokemon-localization";
import { useStore } from "../../../store/store";
import type { Pokemon } from "../../../types/types";
import { getDisplayHabitat, groupStableKey } from "../group-helpers";
import { AddPokemonToGroupAutocomplete } from "./AddPokemonToGroupAutocomplete";
import GroupCard from "./GroupCard";
import { SuggestedNextPokemonControls } from "./SuggestedNextPokemonControls";

interface CustomGroupRowProps {
  group: Pokemon[];
  groupIndex: number;
  suggestions: SuggestedPokemon[];
  availablePokemon: Pokemon[];
  nameLanguage: PokemonNameLanguage;
  onDeleteGroup: (groupIndex: number) => void;
  onAddPokemon: (groupIndex: number, pokemonId: string) => void;
  onRemovePokemon: (groupIndex: number, pokemonId: string) => void;
}

const CustomGroupRow = memo(function CustomGroupRow({
  group,
  groupIndex,
  suggestions,
  availablePokemon,
  nameLanguage,
  onDeleteGroup,
  onAddPokemon,
  onRemovePokemon,
}: CustomGroupRowProps) {
  const groupNumber = groupIndex + 1;

  const handleRemovePokemon = useCallback(
    (pokemonId: string) => onRemovePokemon(groupIndex, pokemonId),
    [groupIndex, onRemovePokemon],
  );
  const handleSelect = useCallback(
    (pokemonId: string) => onAddPokemon(groupIndex, pokemonId),
    [groupIndex, onAddPokemon],
  );
  const handleDelete = useCallback(
    () => onDeleteGroup(groupIndex),
    [groupIndex, onDeleteGroup],
  );

  return (
    <Stack key={`custom-${groupStableKey(group) || groupIndex}`} spacing={1}>
      <GroupCard
        group={group}
        groupNumber={groupNumber}
        habitat={getDisplayHabitat(group)}
        onRemovePokemon={handleRemovePokemon}
        footerContent={
          group.length < 4 ? (
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Add Pokémon to Group {groupNumber}
              </Typography>

              <AddPokemonToGroupAutocomplete
                group={group}
                availablePokemon={availablePokemon}
                nameLanguage={nameLanguage}
                onSelect={handleSelect}
              />

              {group.length > 0 && suggestions.length > 0 && (
                <SuggestedNextPokemonControls
                  suggestions={suggestions}
                  nameLanguage={nameLanguage}
                  onPick={handleSelect}
                />
              )}
            </Stack>
          ) : null
        }
        groupAction={{
          ariaLabel: `Delete my group ${groupNumber}`,
          onClick: handleDelete,
          kind: "remove",
        }}
      />
    </Stack>
  );
});

interface CustomGroupsSectionProps {
  customGroups: Pokemon[][];
  suggestions: SuggestedPokemon[][];
  availablePokemon: Pokemon[];
  onAddGroup: () => void;
  onDeleteGroup: (groupIndex: number) => void;
  onAddPokemon: (groupIndex: number, pokemonId: string) => void;
  onRemovePokemon: (groupIndex: number, pokemonId: string) => void;
}

function CustomGroupsSectionComponent({
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
            variant="contained"
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

          {customGroups.map((group, gi) => (
            <CustomGroupRow
              key={`custom-${groupStableKey(group) || gi}`}
              group={group}
              groupIndex={gi}
              suggestions={suggestions[gi] ?? []}
              availablePokemon={availablePokemon}
              nameLanguage={nameLanguage}
              onDeleteGroup={onDeleteGroup}
              onAddPokemon={onAddPokemon}
              onRemovePokemon={onRemovePokemon}
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export const CustomGroupsSection = memo(CustomGroupsSectionComponent);
