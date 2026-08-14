import { Box, Stack, Typography } from "@mui/material";
import { forwardRef } from "react";
import type { Pokemon } from "../../../types/types";
import { getDisplayHabitat } from "../group-helpers";
import GroupCard from "./GroupCard";

interface ShareGroupImageCardProps {
  group: Pokemon[];
}

/** The off-screen export source: it deliberately uses the production GroupCard. */
export const ShareGroupImageCard = forwardRef<
  HTMLDivElement,
  ShareGroupImageCardProps
>(function ShareGroupImageCard({ group }, ref) {
  return (
    <Box
      ref={ref}
      sx={{
        width: 1200,
        boxSizing: "border-box",
        p: 6,
        bgcolor: "#fffbf4",
        backgroundImage:
          "radial-gradient(circle at 100% 0%, rgba(255, 211, 113, 0.32), transparent 34%)",
      }}
    >
      <Stack spacing={3}>
        <Box
          component="img"
          src="/logo/logo.png"
          alt="PokoMatch"
          sx={{ width: 270, height: "auto", objectFit: "contain" }}
        />
        <GroupCard
          group={group}
          groupNumber={1}
          habitat={getDisplayHabitat(group)}
          showGroupName={false}
        />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Habitat planned with PokoMatch.com
        </Typography>
      </Stack>
    </Box>
  );
});
