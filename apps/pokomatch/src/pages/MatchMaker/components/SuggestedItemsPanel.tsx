import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useState } from "react";
import type { SuggestedItem } from "../../../types/types";

const PREVIEW_COUNT = 5;

interface SuggestedItemsPanelProps {
  suggestions: SuggestedItem[];
  groupFavorites: Set<string>;
}

/** Pill showing one favorite category — primary-tinted if matched, muted if not. */
function FavoriteChip({
  label,
  matched,
}: {
  label: string;
  matched: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        height: 18,
        fontSize: 10,
        fontWeight: matched ? 700 : 400,
        bgcolor: matched
          ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.08)
          : "transparent",
        color: matched ? "primary.main" : "text.disabled",
        borderColor: matched
          ? alpha(theme.palette.primary.main, 0.35)
          : alpha(theme.palette.divider, 0.5),
        "& .MuiChip-label": { px: 0.75 },
      }}
    />
  );
}

/** Tooltip content showing category, tag, and favorite breakdown. */
function ItemTooltipContent({
  item,
  groupFavorites,
}: Pick<SuggestedItem, "item"> & { groupFavorites: Set<string> }) {
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
        {item.favoriteCategories.map((fc) => (
          <FavoriteChip key={fc} label={fc} matched={groupFavorites.has(fc)} />
        ))}
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
                bgcolor: theme.palette.mode === "dark"
                  ? "hsl(240 10% 18%)"
                  : "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[3],
                color: "text.primary",
                maxWidth: 280,
                p: 1.25,
                "& .MuiTooltip-arrow": {
                  color: theme.palette.mode === "dark"
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
            onClick={handleToggle}
            aria-pressed={open}
            sx={{
              height: 26,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              borderColor: open
                ? alpha(theme.palette.primary.main, 0.5)
                : alpha(theme.palette.primary.main, 0.3),
              bgcolor: open
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.primary.main, 0.04),
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
}

/** One row in the full-list dialog. */
function ItemRow({
  item,
  score,
  groupFavorites,
}: SuggestedItem & { groupFavorites: Set<string> }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        py: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) auto",
        gap: 1,
        alignItems: "start",
      }}
    >
      <Stack spacing={0.4} minWidth={0}>
        <Stack direction="row" spacing={0.75} alignItems="baseline">
          <Typography variant="body2" fontWeight={700} noWrap>
            {item.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {item.category}
            {item.tag ? ` · ${item.tag}` : ""}
          </Typography>
        </Stack>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
          {item.favoriteCategories.map((fc) => (
            <FavoriteChip key={fc} label={fc} matched={groupFavorites.has(fc)} />
          ))}
        </Box>
      </Stack>
      <Chip
        label={`${score} match${score !== 1 ? "es" : ""}`}
        size="small"
        sx={{
          height: 20,
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.08),
          color: "primary.main",
          border: "none",
        }}
      />
    </Box>
  );
}

function ItemsDialog({
  open,
  onClose,
  suggestions,
  groupFavorites,
}: {
  open: boolean;
  onClose: () => void;
  suggestions: SuggestedItem[];
  groupFavorites: Set<string>;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
          px: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CategoryOutlinedIcon
            sx={{ fontSize: 18, color: "primary.main" }}
            aria-hidden
          />
          <Typography variant="subtitle1" fontWeight={700} component="span">
            Suggested items
          </Typography>
          <Chip label={`${suggestions.length}`} size="small" />
        </Stack>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 2 }}>
          {suggestions.map((s, i) => (
            <Box key={s.item.id}>
              <ItemRow {...s} groupFavorites={groupFavorites} />
              {i < suggestions.length - 1 && (
                <Divider sx={{ borderStyle: "dashed", opacity: 0.45 }} />
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export const SuggestedItemsPanel = memo(function SuggestedItemsPanel({
  suggestions,
  groupFavorites,
}: SuggestedItemsPanelProps) {
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

        {hasMore && (
          <Button
            size="small"
            variant="text"
            onClick={() => setDialogOpen(true)}
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: "primary.main",
              px: 0.75,
              py: 0,
              minHeight: 0,
              minWidth: 0,
              lineHeight: 1.8,
              textTransform: "none",
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

      <ItemsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        suggestions={suggestions}
        groupFavorites={groupFavorites}
      />
    </Box>
  );
});
