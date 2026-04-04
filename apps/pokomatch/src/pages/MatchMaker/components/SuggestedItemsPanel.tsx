import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useState } from "react";
import type { SuggestedItem } from "../../../types/types";
import { SuggestedItemsDialog } from "./SuggestedItemsDialog";

const PREVIEW_COUNT = 5;

interface SuggestedItemsPanelProps {
  suggestions: SuggestedItem[];
  groupFavorites: Set<string>;
  groupSize: number;
}

/** Tooltip content showing category, tag, and favorite breakdown. */
function ItemTooltipContent({
  item,
  groupFavorites,
}: Pick<SuggestedItem, "item"> & { groupFavorites: Set<string> }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Stack spacing={0.75} sx={{ py: 0.25 }}>
      <Stack direction="row" spacing={0.75} alignItems="baseline">
        <Typography variant="caption" fontWeight={700} color="text.primary">
          {item.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.category}
          {item.tag ? ` · ${item.tag}` : ""}
        </Typography>
      </Stack>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
        {item.favoriteCategories.map((fc) => {
          const matched = groupFavorites.has(fc);
          return (
            <Chip
              key={fc}
              label={fc}
              size="small"
              variant="outlined"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: matched ? 700 : 400,
                bgcolor: matched
                  ? isDark
                    ? theme.palette.action.selected
                    : alpha(theme.palette.primary.main, 0.08)
                  : "transparent",
                color: matched
                  ? isDark
                    ? "primary.light"
                    : "primary.main"
                  : "text.disabled",
                borderColor: matched
                  ? isDark
                    ? "hsl(240 6% 32%)"
                    : alpha(theme.palette.primary.main, 0.35)
                  : alpha(theme.palette.divider, 0.5),
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          );
        })}
      </Box>
    </Stack>
  );
}

/**
 * Chip with a tooltip that works on both desktop (hover) and mobile (tap to
 * open, tap outside or second tap to close).
 */
function ItemChip({
  item,
  score,
  groupFavorites,
}: SuggestedItem & { groupFavorites: Set<string> }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen((v) => !v);
  const handleClose = () => setOpen(false);

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <span>
        <Tooltip
          open={open}
          onOpen={() => setOpen(true)}
          onClose={handleClose}
          disableFocusListener
          disableTouchListener
          title={
            <ItemTooltipContent item={item} groupFavorites={groupFavorites} />
          }
          placement="top"
          arrow
          slotProps={{
            tooltip: {
              sx: {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "hsl(240 10% 18%)"
                    : "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[3],
                color: "text.primary",
                maxWidth: 280,
                p: 1.25,
                "& .MuiTooltip-arrow": {
                  color:
                    theme.palette.mode === "dark"
                      ? "hsl(240 10% 18%)"
                      : "background.paper",
                  "&::before": {
                    border: `1px solid ${theme.palette.divider}`,
                  },
                },
              },
            },
          }}
        >
          <Chip
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
                    bgcolor: isDark
                      ? theme.palette.action.selected
                      : alpha(theme.palette.primary.main, 0.15),
                    color: isDark ? "primary.light" : "primary.main",
                    lineHeight: 1.4,
                  }}
                >
                  {score}
                </Box>
              </Stack>
            }
            size="small"
            variant="outlined"
            onClick={handleToggle}
            aria-pressed={open}
            sx={{
              height: 26,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              borderColor: isDark
                ? open
                  ? alpha(theme.palette.primary.light, 0.45)
                  : "hsl(240 6% 28%)"
                : open
                  ? alpha(theme.palette.primary.main, 0.5)
                  : alpha(theme.palette.primary.main, 0.3),
              bgcolor: isDark
                ? open
                  ? theme.palette.action.selected
                  : alpha(theme.palette.common.white, 0.04)
                : open
                  ? alpha(theme.palette.primary.main, 0.08)
                  : alpha(theme.palette.primary.main, 0.04),
              color: isDark ? "text.primary" : undefined,
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
}

export const SuggestedItemsPanel = memo(function SuggestedItemsPanel({
  suggestions,
  groupFavorites,
  groupSize,
}: SuggestedItemsPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [dialogOpen, setDialogOpen] = useState(false);

  if (suggestions.length === 0) return null;

  const preview = suggestions.slice(0, PREVIEW_COUNT);
  const hasMore = suggestions.length > PREVIEW_COUNT;

  return (
    <Box>
      {/* Header row — label + "Show all" button on the same line */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1 }}
      >
        <CategoryOutlinedIcon
          sx={{
            fontSize: 16,
            color: isDark ? "primary.light" : "primary.main",
          }}
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

        {hasMore && (
          <Button
            size="small"
            variant="text"
            onClick={() => setDialogOpen(true)}
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: isDark ? "primary.light" : "primary.main",
              px: 0.75,
              py: 0,
              minHeight: 0,
              minWidth: 0,
              lineHeight: 1.8,
              textTransform: "none",
              "&:hover": isDark
                ? { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                : undefined,
            }}
          >
            Show all {suggestions.length} →
          </Button>
        )}
      </Stack>

      {/* Preview chips — tap to reveal favorites breakdown */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {preview.map((s) => (
          <ItemChip key={s.item.id} {...s} groupFavorites={groupFavorites} />
        ))}
      </Box>

      <SuggestedItemsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        suggestions={suggestions}
        groupFavorites={groupFavorites}
        groupSize={groupSize}
      />
    </Box>
  );
});
