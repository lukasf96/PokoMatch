import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo } from "react";
import type { Pokemon } from "../../../types/types";
import { getDisplayHabitat, groupStableKey } from "../group-helpers";
import GroupCard from "./GroupCard";

interface AutoGroupsSectionProps {
  groups: Pokemon[][];
  preferEvolutionLines: boolean;
  onPreferEvolutionLinesChange: (value: boolean) => void;
  onQuickAddGroup: (group: Pokemon[]) => void;
}

function AutoGroupsSectionComponent({
  groups,
  preferEvolutionLines,
  onPreferEvolutionLinesChange,
  onQuickAddGroup,
}: AutoGroupsSectionProps) {
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
          sx={{ flex: 1, minWidth: 0, pr: 1 }}
        >
          <Typography component="span" fontWeight={700}>
            Suggested groups
          </Typography>
          <Chip label={`${groups.length} groups`} size="small" />
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
                  inputProps={{
                    "aria-label":
                      "Prefer grouping evolution lines when scores are close",
                  }}
                />
              }
              label={
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  component="span"
                >
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
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
        <Stack spacing={2}>
          {groups.map((group, index) => (
            <Stack key={groupStableKey(group)} spacing={1}>
              <GroupCard
                group={group}
                groupNumber={index + 1}
                habitat={getDisplayHabitat(group)}
                groupAction={{
                  ariaLabel: `Quick add suggested group ${index + 1}`,
                  onClick: () => onQuickAddGroup(group),
                  kind: "add",
                }}
              />
            </Stack>
          ))}
          {groups.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No suggested groups left from the remaining pool.
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export const AutoGroupsSection = memo(AutoGroupsSectionComponent);
