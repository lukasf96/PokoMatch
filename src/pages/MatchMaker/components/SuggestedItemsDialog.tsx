import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo } from "react";
import type { SuggestedItem } from "../../../types/types";

/** Pill showing one favorite category — primary-tinted if matched, muted if not. */
function FavoriteChip({ label, matched }: { label: string; matched: boolean }) {
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
}

function ItemRow({
  item,
  score,
  pokemonCoverage,
  groupFavorites,
  groupSize,
}: SuggestedItem & { groupFavorites: Set<string>; groupSize: number }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
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
            <FavoriteChip
              key={fc}
              label={fc}
              matched={groupFavorites.has(fc)}
            />
          ))}
        </Box>
      </Stack>
      <Stack alignItems="flex-end" spacing={0.5}>
        <Chip
          label={`${pokemonCoverage}/${groupSize} Pokémon`}
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
            bgcolor: isDark
              ? theme.palette.action.selected
              : alpha(theme.palette.primary.main, 0.08),
            color: isDark ? "primary.light" : "primary.main",
            border: "none",
          }}
        />
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
          {score} favorite{score !== 1 ? "s" : ""}
        </Typography>
      </Stack>
    </Box>
  );
}

interface SuggestedItemsDialogProps {
  open: boolean;
  onClose: () => void;
  suggestions: SuggestedItem[];
  groupFavorites: Set<string>;
  groupSize: number;
}

export const SuggestedItemsDialog = memo(function SuggestedItemsDialog({
  open,
  onClose,
  suggestions,
  groupFavorites,
  groupSize,
}: SuggestedItemsDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
    >
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
              <ItemRow {...s} groupFavorites={groupFavorites} groupSize={groupSize} />
              {i < suggestions.length - 1 && (
                <Divider sx={{ borderStyle: "dashed", opacity: 0.45 }} />
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
});
