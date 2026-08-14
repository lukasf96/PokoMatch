import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { Pokemon, PokopiaLocation } from "../../../types/types";
import { getDisplayHabitat } from "../group-helpers";
import GroupCard from "./GroupCard";

interface SharedGroupPreviewProps {
  group: Pokemon[];
  location?: PokopiaLocation;
  onAdd: () => void;
}

/** Read-only shared plan, intentionally rendered with the same card as Match Maker groups. */
export function SharedGroupPreview({
  group,
  location,
  onAdd,
}: SharedGroupPreviewProps) {
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby="shared-group-heading"
      sx={{ mb: 3, overflow: "hidden", borderColor: "primary.light" }}
    >
      <Stack spacing={2} sx={{ p: { xs: 1.25, sm: 2 } }}>
        <Stack spacing={0.35}>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 800, lineHeight: 1.2 }}
          >
            Shared habitat plan
          </Typography>
          <Typography id="shared-group-heading" component="h2" variant="h6" sx={{ fontWeight: 850 }}>
            Someone shared this group with you
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review it, then add it to My Groups and remix it with your own roster.
          </Typography>
        </Stack>
        <Box sx={{ pointerEvents: "none", "& button": { display: "none" } }}>
          <GroupCard
            group={group}
            groupNumber={1}
            habitat={getDisplayHabitat(group)}
            location={location}
          />
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<GroupAddOutlinedIcon />}
          onClick={onAdd}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          Add to My Groups
        </Button>
      </Stack>
    </Paper>
  );
}
