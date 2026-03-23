import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { Habitat, Pokemon } from "../../../types/types";
import GroupCard from "./GroupCard";

interface AutoGroupsSectionProps {
  groups: Pokemon[][];
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

export function AutoGroupsSection({ groups }: AutoGroupsSectionProps) {
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
            Auto groups
          </Typography>
          <Chip label={`${groups.length} groups`} size="small" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        <Stack spacing={2}>
          {groups.map((group, index) => (
            <GroupCard
              key={groupStableKey(group)}
              group={group}
              groupNumber={index + 1}
              habitat={getDisplayHabitat(group)}
            />
          ))}
          {groups.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No auto-matched groups left.
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
