import StarsIcon from "@mui/icons-material/Stars";
import { Chip, useTheme, type SxProps, type Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, type ReactNode } from "react";
import type { HabitatColorSet } from "../services/habitatColors";

interface SpecialtyChipBaseProps {
  label: ReactNode;
  /** `compact`: smaller type used in the group card header row. */
  density?: "default" | "compact";
  sx?: SxProps<Theme>;
}

type SpecialtyChipProps =
  | (SpecialtyChipBaseProps & {
      surface?: "neutral";
    })
  | (SpecialtyChipBaseProps & {
      surface: "onTint";
      /** Habitat colors so the chip matches the tinted bar (avoids primary-on-habitat clash). */
      tint: Pick<HabitatColorSet, "text" | "border">;
    });

function specialtyChipSx(
  theme: Theme,
  surface: "neutral" | "onTint",
  tint?: Pick<HabitatColorSet, "text" | "border">,
): SxProps<Theme> {
  const isDark = theme.palette.mode === "dark";

  if (surface === "onTint" && tint) {
    return {
      bgcolor: alpha(tint.text, isDark ? 0.16 : 0.12),
      color: tint.text,
      border: "1px solid",
      borderColor: alpha(tint.border, isDark ? 0.5 : 0.45),
      "& .MuiChip-icon": { color: "inherit" },
    };
  }

  if (isDark) {
    return {
      bgcolor: theme.palette.action.selected,
      color: theme.palette.primary.light,
      border: "1px solid",
      borderColor: alpha(theme.palette.primary.main, 0.38),
      "& .MuiChip-icon": { color: "inherit" },
    };
  }

  return {
    bgcolor: alpha(theme.palette.primary.main, 0.08),
    color: "primary.main",
    border: "1px solid",
    borderColor: alpha(theme.palette.primary.main, 0.2),
    "& .MuiChip-icon": { color: "inherit" },
  };
}

export const SpecialtyChip = memo(function SpecialtyChip(
  props: SpecialtyChipProps,
) {
  const { label, density = "default", sx } = props;
  const surface = props.surface ?? "neutral";
  const tint = props.surface === "onTint" ? props.tint : undefined;

  const theme = useTheme();
  const base = specialtyChipSx(theme, surface, tint);

  return (
    <Chip
      label={label}
      size="small"
      icon={
        <StarsIcon
          sx={{
            fontSize:
              density === "compact" ? "12px !important" : "14px !important",
          }}
        />
      }
      sx={[
        density === "compact"
          ? { height: 18, fontSize: 9, fontWeight: 600 }
          : { height: 20, fontSize: 10, fontWeight: 600 },
        base,
        ...(sx != null ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    />
  );
});
