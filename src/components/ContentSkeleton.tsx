import { Skeleton, Stack, type SkeletonProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

/** Shared tint — default MUI skeleton is nearly invisible on light paper. */
export const contentSkeletonSx: SxProps<Theme> = {
  borderRadius: 1,
  bgcolor: (theme) =>
    theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[100],
};

interface ContentSkeletonProps {
  /** Number of placeholder blocks. */
  count?: number;
  height?: number;
  spacing?: number;
  animation?: SkeletonProps["animation"];
}

/**
 * Stacked rounded placeholders matching the Match Maker suggested-groups
 * loading state (wave animation + explicit light/dark tint).
 */
export function ContentSkeleton({
  count = 4,
  height = 132,
  spacing = 2,
  animation = "wave",
}: ContentSkeletonProps) {
  return (
    <Stack spacing={spacing} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          animation={animation}
          height={height}
          sx={contentSkeletonSx}
        />
      ))}
    </Stack>
  );
}
