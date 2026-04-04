import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
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
            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.14)
                  : alpha(theme.palette.primary.main, 0.22),
                bgcolor: isDark
                  ? alpha(theme.palette.common.white, 0.04)
                  : alpha(theme.palette.primary.main, 0.04),
                p: { xs: 1.5, sm: 2 },
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="stretch"
                  useFlexGap
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    aria-hidden
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isDark
                          ? alpha(theme.palette.common.white, 0.08)
                          : alpha(theme.palette.primary.main, 0.14),
                        color: isDark
                          ? "text.secondary"
                          : "primary.main",
                      }}
                    >
                      <GroupAddOutlinedIcon sx={{ fontSize: 26 }} />
                    </Box>
                  </Box>
                  <Stack spacing={1.25} flex={1} minWidth={0}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      sx={{ letterSpacing: "0.01em" }}
                    >
                      Add Pokémon · Group {groupNumber}
                    </Typography>

                    <AddPokemonToGroupAutocomplete
                      embedded
                      group={group}
                      availablePokemon={availablePokemon}
                      nameLanguage={nameLanguage}
                      onSelect={handleSelect}
                    />
                  </Stack>
                </Stack>

                {group.length > 0 && suggestions.length > 0 ? (
                  <>
                    <Divider
                      flexItem
                      sx={{
                        borderStyle: "dashed",
                        borderColor: alpha(theme.palette.divider, 0.3),
                      }}
                    />
                    <SuggestedNextPokemonControls
                      suggestions={suggestions}
                      nameLanguage={nameLanguage}
                      onPick={handleSelect}
                    />
                  </>
                ) : null}
              </Stack>
            </Box>
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
