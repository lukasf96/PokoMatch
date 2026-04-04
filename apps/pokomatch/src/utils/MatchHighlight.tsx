import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
import {
  computeHighlightSegments,
  searchTokensFromInput,
} from "./search-text";

export function MatchHighlight({ text, query }: { text: string; query: string }) {
  const theme = useTheme();
  const segments = useMemo(() => {
    if (searchTokensFromInput(query).length === 0) {
      return null;
    }
    return computeHighlightSegments(text, query);
  }, [text, query]);

  if (segments === null) {
    return text;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <Box
            key={i}
            component="mark"
            sx={{
              background: `linear-gradient(
                110deg,
                ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.42 : 0.2)} 0%,
                ${alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.35 : 0.16)} 100%
              )`,
              color: "inherit",
              borderRadius: "4px",
              px: 0.125,
              fontWeight: 800,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
            }}
          >
            {seg.text}
          </Box>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
