import { Box, Stack, ThemeProvider, Typography } from "@mui/material";
import { forwardRef, type CSSProperties } from "react";
import { createAppTheme } from "../../../theme";
import type { Pokemon } from "../../../types/types";
import { getDisplayHabitat } from "../group-helpers";
import GroupCard from "./GroupCard";

interface ShareGroupImageCardProps {
  group: Pokemon[];
}

const shareImageTheme = createAppTheme("light");
type CssVariablesTheme = typeof shareImageTheme & {
  generateStyleSheets: () => Array<{ ":root": CSSProperties }>;
};
// ThemeProvider changes React's theme context, but MUI's CSS variables remain
// inherited from the app root. Put the light theme's generated variables on the
// capture root as well so a dark app cannot leak into the PNG.
const shareImageCssVariables = Object.assign(
  {},
  ...(shareImageTheme as CssVariablesTheme)
    .generateStyleSheets()
    .map((styleSheet) => styleSheet[":root"]),
) as CSSProperties;

/** The off-screen export source: it deliberately uses the production GroupCard. */
export const ShareGroupImageCard = forwardRef<
  HTMLDivElement,
  ShareGroupImageCardProps
>(function ShareGroupImageCard({ group }, ref) {
  return (
    <ThemeProvider theme={shareImageTheme}>
      <Box
        ref={ref}
        style={shareImageCssVariables}
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
          <Typography
            variant="caption"
            sx={{ alignSelf: "flex-end", color: "text.secondary", fontWeight: 600, opacity: 0.72 }}
          >
            Habitat planned with PokoMatch.com
          </Typography>
        </Stack>
      </Box>
    </ThemeProvider>
  );
});
