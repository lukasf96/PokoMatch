import type { SvgIconComponent } from "@mui/icons-material";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LandscapeIcon from "@mui/icons-material/Landscape";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import type { Theme } from "@mui/material/styles";
import type { Habitat } from "../types/types";

interface HabitatColorSet {
  bg: string;
  text: string;
  border: string;
}

export function getHabitatColors(
  theme: Theme,
): Record<Habitat, HabitatColorSet> {
  const isDark = theme.palette.mode === "dark";

  return {
    Bright: {
      bg: isDark ? "#4a3b14" : "#fffde7",
      text: isDark ? "#ffe082" : "#f57f17",
      border: isDark ? "#b58900" : "#f9a825",
    },
    Cool: {
      bg: isDark ? "#10313a" : "#e0f7fa",
      text: isDark ? "#80deea" : "#006064",
      border: isDark ? "#26c6da" : "#00acc1",
    },
    Dark: {
      bg: isDark ? "#2d1b38" : "#f3e5f5",
      text: isDark ? "#e1bee7" : "#4a148c",
      border: isDark ? "#ab47bc" : "#7b1fa2",
    },
    Dry: {
      bg: isDark ? "#3f2117" : "#fbe9e7",
      text: isDark ? "#ffab91" : "#bf360c",
      border: isDark ? "#ff7043" : "#e64a19",
    },
    Humid: {
      bg: isDark ? "#12304a" : "#e1f5fe",
      text: isDark ? "#90caf9" : "#01579b",
      border: isDark ? "#42a5f5" : "#0288d1",
    },
    Warm: {
      bg: isDark ? "#4a2a0d" : "#fff3e0",
      text: isDark ? "#ffcc80" : "#e65100",
      border: isDark ? "#ff9800" : "#f57c00",
    },
  };
}

export const habitatIcons: Record<Habitat, SvgIconComponent> = {
  Bright: WbSunnyIcon,
  Cool: AcUnitIcon,
  Dark: DarkModeIcon,
  Dry: LandscapeIcon,
  Humid: WaterDropIcon,
  Warm: LocalFireDepartmentIcon,
};
