import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  Fade,
  FormControlLabel,
  IconButton,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import {
  ContentSkeleton,
  contentSkeletonSx,
} from "../../../components/ContentSkeleton";
import { InstantCollapse } from "../../../components/InstantCollapse";
import { suggestItemsForGroup } from "../../../services/items";
import type { Pokemon } from "../../../types/types";
import { getDisplayHabitat, groupStableKey } from "../group-helpers";
import GroupCard from "./GroupCard";
import { SuggestedItemsPanel } from "./SuggestedItemsPanel";

interface AutoGroupRowProps {
  group: Pokemon[];
  groupNumber: number;
  onQuickAddGroup: (group: Pokemon[]) => void;
}

/**
 * One suggested group. Item suggestions are derived from the (stable) group
 * reference so this row only re-renders when its own group or number changes —
 * never when the evolution switch or the "updating" flag toggle.
 */
const AutoGroupRow = memo(function AutoGroupRow({
  group,
  groupNumber,
  onQuickAddGroup,
}: AutoGroupRowProps) {
  const itemSuggestions = useMemo(() => suggestItemsForGroup(group), [group]);
  const groupFavorites = useMemo(
    () => new Set(group.flatMap((p) => p.favorites)),
    [group],
  );
  const habitat = useMemo(() => getDisplayHabitat(group), [group]);
  const handleQuickAdd = useCallback(
    () => onQuickAddGroup(group),
    [onQuickAddGroup, group],
  );

  return (
    <Stack spacing={1}>
      <GroupCard
        group={group}
        groupNumber={groupNumber}
        habitat={habitat}
        footerContent={
          itemSuggestions.length > 0 ? (
            <SuggestedItemsPanel
              suggestions={itemSuggestions}
              groupFavorites={groupFavorites}
              groupSize={group.length}
            />
          ) : undefined
        }
        groupAction={{
          ariaLabel: `Quick add suggested group ${groupNumber}`,
          onClick: handleQuickAdd,
          kind: "add",
        }}
      />
    </Stack>
  );
});

interface AutoGroupsListProps {
  groups: Pokemon[][];
  onQuickAddGroup: (group: Pokemon[]) => void;
}

/**
 * The suggested-groups list. Memoized and kept independent of the header state
 * (evolution switch, "updating" indicator) so those never force a re-render of
 * the (potentially dozens of) heavy group cards.
 */
const AutoGroupsList = memo(function AutoGroupsList({
  groups,
  onQuickAddGroup,
}: AutoGroupsListProps) {
  return (
    <Stack spacing={2}>
      {groups.map((group, index) => (
        <AutoGroupRow
          key={groupStableKey(group)}
          group={group}
          groupNumber={index + 1}
          onQuickAddGroup={onQuickAddGroup}
        />
      ))}
    </Stack>
  );
});

/** Placeholder cards shown while the first computation is still running. */
function AutoGroupsSkeleton() {
  return (
    <Box data-testid="auto-groups-skeleton">
      <ContentSkeleton />
    </Box>
  );
}

interface AutoGroupsSectionProps {
  groups: Pokemon[][];
  preferEvolutionLines: boolean;
  onPreferEvolutionLinesChange: (value: boolean) => void;
  onQuickAddGroup: (group: Pokemon[]) => void;
  isRecomputing?: boolean;
}

function AutoGroupsSectionComponent({
  groups,
  preferEvolutionLines,
  onPreferEvolutionLinesChange,
  onQuickAddGroup,
  isRecomputing = false,
}: AutoGroupsSectionProps) {
  // First run: no results yet and still computing — show placeholders instead
  // of a misleading "no groups" message.
  const initialLoading = isRecomputing && groups.length === 0;
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
            flex: 1,
            minWidth: 0,
            pr: 1,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
            }}
          >
            Suggested groups
          </Typography>
          {initialLoading ? (
            <Skeleton
              variant="rounded"
              animation="wave"
              width={64}
              height={24}
              sx={contentSkeletonSx}
            />
          ) : (
            <Chip label={`${groups.length} groups`} size="small" />
          )}
          <Fade
            in={isRecomputing}
            timeout={{ enter: 0, exit: 400 }}
            unmountOnExit
          >
            <Stack
              direction="row"
              spacing={0.5}
              component="span"
              sx={{ alignItems: "center", color: "text.secondary" }}
            >
              <CircularProgress size={12} thickness={6} color="inherit" />
              <Typography component="span" variant="caption">
                Updating…
              </Typography>
            </Stack>
          </Fade>
          <Box sx={{ flexGrow: 1, minWidth: 8 }} aria-hidden />
          <Box
            component="span"
            onClick={(event) => event.stopPropagation()}
            onFocus={(event) => event.stopPropagation()}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={preferEvolutionLines}
                  onChange={(_, checked) =>
                    onPreferEvolutionLinesChange(checked)
                  }
                  slotProps={{
                    input: {
                      "aria-label":
                        "Prefer grouping evolution lines when scores are close",
                    },
                  }}
                />
              }
              label={
                <Stack
                  direction="row"
                  spacing={0.5}
                  component="span"
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    Prefer grouping Evolution lines together
                  </Typography>
                  <Tooltip title="When this is on, suggested groups slightly favor keeping evolution families together wherever habitat rules still allow it. Total shared-favorite overlap can dip a little, but the trade-off is usually very small.">
                    <IconButton
                      component="span"
                      size="small"
                      aria-label="How evolution line grouping works"
                      onClick={(event) => event.stopPropagation()}
                      onFocus={(event) => event.stopPropagation()}
                      sx={{ p: 0.25, color: "text.secondary" }}
                    >
                      <InfoOutlined sx={{ fontSize: 18 }} aria-hidden />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
              sx={{ mr: 0 }}
            />
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        {groups.length > 0 ? (
          <AutoGroupsList groups={groups} onQuickAddGroup={onQuickAddGroup} />
        ) : initialLoading ? (
          <AutoGroupsSkeleton />
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No suggested groups left from the remaining pool.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export const AutoGroupsSection = memo(AutoGroupsSectionComponent);
