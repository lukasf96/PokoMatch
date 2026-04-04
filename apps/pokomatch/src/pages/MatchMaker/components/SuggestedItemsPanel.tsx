import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo } from "react";
import type { SuggestedItem } from "../../../types/types";

interface SuggestedItemsPanelProps {
  suggestions: SuggestedItem[];
}

export const SuggestedItemsPanel = memo(function SuggestedItemsPanel({
  suggestions,
}: SuggestedItemsPanelProps) {
  const theme = useTheme();

  if (suggestions.length === 0) return null;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <CategoryOutlinedIcon
          sx={{ fontSize: 16, color: "primary.main" }}
          aria-hidden
        />
        <Typography
          variant="caption"
          component="span"
          sx={{
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          Suggested items
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
        }}
      >
        {suggestions.map(({ item, score }) => (
          <Chip
            key={item.id}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{item.name}</span>
                <Box
                  component="span"
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    px: 0.5,
                    py: 0.1,
                    borderRadius: 0.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: "primary.main",
                    lineHeight: 1.4,
                  }}
                >
                  {score}
                </Box>
              </Stack>
            }
            size="small"
            variant="outlined"
            title={`${item.name} · Category: ${item.category}${item.tag ? ` · Tag: ${item.tag}` : ""} · ${score} shared favorite${score !== 1 ? "s" : ""}`}
            sx={{
              height: 26,
              fontSize: 12,
              fontWeight: 600,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              "& .MuiChip-label": { px: 1 },
            }}
          />
        ))}
      </Box>
    </Box>
  );
});
