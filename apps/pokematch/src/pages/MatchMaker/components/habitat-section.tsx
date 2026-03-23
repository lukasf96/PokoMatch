import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { habitatColors, habitatEmoji } from "../../../services/habitatColors";
import type { Habitat, Pokemon } from "../../../types/types";
import GroupCard from "./GroupCard";

interface HabitatSectionProps {
  habitat: Habitat;
  pokemon: Pokemon[];
  autoGroups: Pokemon[][];
}

function groupStableKey(group: { id: string }[]): string {
  return group.map((p) => p.id).join("|");
}

export function HabitatSection({
  habitat,
  pokemon,
  autoGroups,
}: HabitatSectionProps) {
  const colors = habitatColors[habitat];
  const summaryId = `habitat-${habitat}-summary`;

  if (pokemon.length === 0) return null;

  return (
    <Accordion
      defaultExpanded
      elevation={0}
      aria-labelledby={summaryId}
      sx={{
        // Theme already sets a 1px border on Accordion; Paper `outlined` stacked a second
        // border on top and made corners look wrong. Clip children to the same radius.
        borderColor: colors.border,
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <AccordionSummary
        id={summaryId}
        expandIcon={<ExpandMoreIcon aria-hidden />}
        sx={{
          bgcolor: colors.bg,
          minHeight: 48,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Typography
            component="span"
            sx={{ fontSize: 20, lineHeight: 1 }}
            aria-hidden
          >
            {habitatEmoji[habitat]}
          </Typography>
          <Typography component="span" fontWeight={700} color={colors.text}>
            {habitat}
          </Typography>
          <Chip
            label={`${pokemon.length} Pokémon`}
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              bgcolor: "background.paper",
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          />
          <Chip
            label={`${autoGroups.length} groups`}
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              bgcolor: colors.border,
              color: "common.white",
            }}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        <Stack spacing={2}>
          {autoGroups.map((group, gi) => (
            <GroupCard
              key={groupStableKey(group)}
              group={group}
              groupNumber={gi + 1}
              habitat={habitat}
            />
          ))}
          {autoGroups.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No auto-matched groups left for this habitat.
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
