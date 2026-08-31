import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { memo, useCallback, useMemo, useState } from "react";
import { InstantCollapse } from "../../../components/InstantCollapse";
import type { SuggestedPokemon } from "../../../services/matching.service";
import type { PokemonNameLanguage } from "../../../services/pokemon-localization";
import { useStore } from "../../../store/store";
import type {
  Pokemon,
  PokopiaLocation,
  SuggestedItem,
} from "../../../types/types";
import { groupFavoriteKeys } from "../../../utils/favorites";
import { getDisplayHabitat } from "../group-helpers";
import { AddPokemonToGroupAutocomplete } from "./AddPokemonToGroupAutocomplete";
import GroupCard from "./GroupCard";
import { SuggestedItemsPanel } from "./SuggestedItemsPanel";
import { SuggestedNextPokemonControls } from "./SuggestedNextPokemonControls";
import { ShareGroupDialog } from "./ShareGroupDialog";

export interface ResolvedCustomGroup {
  id: string;
  members: Pokemon[];
  location?: PokopiaLocation;
}

interface CustomGroupRowProps {
  group: ResolvedCustomGroup;
  groupIndex: number;
  suggestions: SuggestedPokemon[];
  itemSuggestions: SuggestedItem[];
  availablePokemon: Pokemon[];
  nameLanguage: PokemonNameLanguage;
  onDeleteGroup: (groupIndex: number) => void;
  onAddPokemon: (groupIndex: number, pokemonId: string) => void;
  onRemovePokemon: (groupIndex: number, pokemonId: string) => void;
  onLocationChange: (
    groupIndex: number,
    location: PokopiaLocation | undefined,
  ) => void;
}

const CustomGroupRow = memo(function CustomGroupRow({
  group,
  groupIndex,
  suggestions,
  itemSuggestions,
  availablePokemon,
  nameLanguage,
  onDeleteGroup,
  onAddPokemon,
  onRemovePokemon,
  onLocationChange,
}: CustomGroupRowProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const groupNumber = groupIndex + 1;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

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
  const handleLocationChange = useCallback(
    (location: PokopiaLocation | undefined) =>
      onLocationChange(groupIndex, location),
    [groupIndex, onLocationChange],
  );

  const groupFavorites = useMemo(
    () => groupFavoriteKeys(group.members),
    [group.members],
  );

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "relative",
        zIndex: isDragging ? 2 : 0,
      }}
    >
      <GroupCard
        group={group.members}
        groupNumber={groupNumber}
        habitat={getDisplayHabitat(group.members)}
        location={group.location}
        onLocationChange={handleLocationChange}
        onRemovePokemon={handleRemovePokemon}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        footerContent={
          group.members.length < 4 || itemSuggestions.length > 0 ? (
            <Stack spacing={2}>
              {group.members.length < 4 ? (
                <>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    useFlexGap
                    sx={{
                      alignItems: "stretch",
                    }}
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
                          color: isDark ? "text.secondary" : "primary.main",
                        }}
                      >
                        <GroupAddOutlinedIcon sx={{ fontSize: 26 }} />
                      </Box>
                    </Box>
                    <Stack
                      spacing={1.25}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: "0.01em",
                        }}
                      >
                        Add Pokémon · Group {groupNumber}
                      </Typography>

                      <AddPokemonToGroupAutocomplete
                        embedded
                        group={group.members}
                        availablePokemon={availablePokemon}
                        nameLanguage={nameLanguage}
                        onSelect={handleSelect}
                      />
                    </Stack>
                  </Stack>

                  {group.members.length > 0 && suggestions.length > 0 ? (
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
                </>
              ) : null}

              {itemSuggestions.length > 0 ? (
                <>
                  {group.members.length < 4 && (
                    <Divider
                      flexItem
                      sx={{
                        borderStyle: "dashed",
                        borderColor: alpha(theme.palette.divider, 0.3),
                      }}
                    />
                  )}
                  <SuggestedItemsPanel
                    suggestions={itemSuggestions}
                    groupFavorites={groupFavorites}
                    groupSize={group.members.length}
                  />
                </>
              ) : null}
            </Stack>
          ) : null
        }
        groupAction={{
          ariaLabel: `Delete my group ${groupNumber}`,
          onClick: handleDelete,
          kind: "remove",
        }}
        groupActions={[
          {
            ariaLabel: `Share group ${groupNumber}`,
            onClick: () => setShareOpen(true),
            kind: "share",
            disabled: group.members.length === 0,
          },
        ]}
      />
      <ShareGroupDialog
        group={group.members}
        groupNumber={groupNumber}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </Box>
  );
});

interface CustomGroupsSectionProps {
  customGroups: ResolvedCustomGroup[];
  suggestions: SuggestedPokemon[][];
  itemSuggestions: SuggestedItem[][];
  availablePokemon: Pokemon[];
  onAddGroup: () => void;
  onDeleteGroup: (groupIndex: number) => void;
  onAddPokemon: (groupIndex: number, pokemonId: string) => void;
  onRemovePokemon: (groupIndex: number, pokemonId: string) => void;
  onReorderGroups: (activeId: string, overId: string) => void;
  onLocationChange: (
    groupIndex: number,
    location: PokopiaLocation | undefined,
  ) => void;
}

function CustomGroupsSectionComponent({
  customGroups,
  suggestions,
  itemSuggestions,
  availablePokemon,
  onAddGroup,
  onDeleteGroup,
  onAddPokemon,
  onRemovePokemon,
  onReorderGroups,
  onLocationChange,
}: CustomGroupsSectionProps) {
  const nameLanguage = useStore((state) => state.nameLanguage);
  const groupIds = useMemo(
    () => customGroups.map((group) => group.id),
    [customGroups],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      onReorderGroups(String(active.id), String(over.id));
    },
    [onReorderGroups],
  );

  return (
    <Accordion
      defaultExpanded
      disableGutters
      elevation={0}
      slots={{ transition: InstantCollapse }}
      sx={{ borderRadius: 1, overflow: "hidden" }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon aria-hidden />}
        sx={{
          minHeight: 0,
          "&.Mui-expanded": { minHeight: 0 },
          "& .MuiAccordionSummary-content": {
            margin: 0,
            alignItems: "center",
            my: 1.5,
          },
          "& .MuiAccordionSummary-content.Mui-expanded": {
            margin: 0,
            my: 1.5,
          },
          "& .MuiAccordionSummary-expandIconWrapper": {
            transition: "none",
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
            }}
          >
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
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              Add your habitats you have already setup in-game.
            </Typography>
          )}

          {customGroups.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={groupIds}
                strategy={verticalListSortingStrategy}
              >
                <Stack spacing={2}>
                  {customGroups.map((group, gi) => (
                    <CustomGroupRow
                      key={group.id}
                      group={group}
                      groupIndex={gi}
                      suggestions={suggestions[gi] ?? []}
                      itemSuggestions={itemSuggestions[gi] ?? []}
                      availablePokemon={availablePokemon}
                      nameLanguage={nameLanguage}
                      onDeleteGroup={onDeleteGroup}
                      onAddPokemon={onAddPokemon}
                      onRemovePokemon={onRemovePokemon}
                      onLocationChange={onLocationChange}
                    />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          ) : null}

          {customGroups.length > 0 && (
            <Button
              onClick={onAddGroup}
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              Add group
            </Button>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export const CustomGroupsSection = memo(CustomGroupsSectionComponent);
