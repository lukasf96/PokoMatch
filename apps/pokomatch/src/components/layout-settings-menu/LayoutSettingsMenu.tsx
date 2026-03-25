import {
  ArrowBackOutlined,
  Check,
  ChevronRight,
  DarkModeOutlined,
  InfoOutlined,
  LightModeOutlined,
  PaletteOutlined,
  SettingsBrightnessOutlined,
  SettingsOutlined,
  TranslateOutlined,
} from "@mui/icons-material";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import type { ElementType, MouseEvent } from "react";
import { useState } from "react";
import { useStore } from "../../store/store";
import { LayoutInfoDialog } from "./LayoutInfoDialog";

type NameLanguage = "en" | "de" | "fr";
type ThemeMode = "system" | "light" | "dark";
type SettingsView = "root" | "language" | "theme";

const LANGUAGE_LABELS: Record<NameLanguage, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
};

const THEME_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const LANGUAGE_CODES: NameLanguage[] = ["en", "de", "fr"];

const THEME_CHOICES: { mode: ThemeMode; icon: ElementType }[] = [
  { mode: "system", icon: SettingsBrightnessOutlined },
  { mode: "light", icon: LightModeOutlined },
  { mode: "dark", icon: DarkModeOutlined },
];

const menuItemBody2 = { typography: "body2" } as const;

const rowBetweenSx = {
  ...menuItemBody2,
  display: "flex",
  justifyContent: "space-between",
  gap: 1.5,
} as const;

const iconRowSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
} as const;

interface NavRootItemProps {
  icon: ElementType;
  title: string;
  detail?: string;
  onClick: () => void;
  showChevron?: boolean;
}

function NavRootItem({
  icon: Icon,
  title,
  detail,
  onClick,
  showChevron = true,
}: NavRootItemProps) {
  return (
    <MenuItem onClick={onClick} sx={rowBetweenSx}>
      <Box sx={iconRowSx}>
        <Icon fontSize="small" />
        <Box>
          <Typography variant="body2">{title}</Typography>
          {detail ? (
            <Typography variant="caption" color="text.secondary">
              {detail}
            </Typography>
          ) : null}
        </Box>
      </Box>
      {showChevron ? <ChevronRight fontSize="small" color="action" /> : null}
    </MenuItem>
  );
}

interface BackMenuRowProps {
  onClick: () => void;
}

function BackMenuRow({ onClick }: BackMenuRowProps) {
  return (
    <MenuItem onClick={onClick} sx={{ ...menuItemBody2, mb: 0.5 }}>
      <ArrowBackOutlined sx={{ mr: 1 }} fontSize="small" />
      Back
    </MenuItem>
  );
}

interface SelectableSettingRowProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: ElementType;
}

function SelectableSettingRow({
  label,
  selected,
  onClick,
  icon: Icon,
}: SelectableSettingRowProps) {
  return (
    <MenuItem selected={selected} onClick={onClick} sx={rowBetweenSx}>
      {Icon ? (
        <Box sx={iconRowSx}>
          <Icon fontSize="small" />
          {label}
        </Box>
      ) : (
        label
      )}
      {selected ? <Check fontSize="small" color="primary" /> : null}
    </MenuItem>
  );
}

export function LayoutSettingsMenu() {
  const nameLanguage = useStore((s) => s.nameLanguage);
  const themeMode = useStore((s) => s.themeMode);
  const setNameLanguage = useStore((s) => s.setNameLanguage);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [settingsView, setSettingsView] = useState<SettingsView>("root");
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const isSettingsOpen = Boolean(settingsAnchorEl);

  function openSettingsMenu(event: MouseEvent<HTMLElement>) {
    setSettingsAnchorEl(event.currentTarget);
    setSettingsView("root");
  }

  function closeSettingsMenu() {
    setSettingsAnchorEl(null);
    setSettingsView("root");
  }

  function openInfoDialog() {
    setIsInfoDialogOpen(true);
    closeSettingsMenu();
  }

  function handleLanguageChange(language: NameLanguage) {
    setNameLanguage(language);
    closeSettingsMenu();
  }

  function handleThemeModeChange(mode: ThemeMode) {
    setThemeMode(mode);
    closeSettingsMenu();
  }

  return (
    <>
      <IconButton
        size="small"
        onClick={openSettingsMenu}
        aria-label="Open settings"
        aria-controls={isSettingsOpen ? "layout-settings-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={isSettingsOpen ? "true" : undefined}
        sx={{ ml: { xs: 0, sm: 0.5 } }}
      >
        <SettingsOutlined fontSize="small" />
      </IconButton>

      <Menu
        id="layout-settings-menu"
        anchorEl={settingsAnchorEl}
        open={isSettingsOpen}
        onClose={closeSettingsMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { mt: 0.5, minWidth: 240 },
          },
        }}
      >
        {settingsView === "root"
          ? [
              <NavRootItem
                key="language"
                icon={TranslateOutlined}
                title="Pokémon Language"
                detail={LANGUAGE_LABELS[nameLanguage]}
                onClick={() => setSettingsView("language")}
              />,
              <NavRootItem
                key="theme"
                icon={PaletteOutlined}
                title="Theme"
                detail={THEME_LABELS[themeMode]}
                onClick={() => setSettingsView("theme")}
              />,
              <NavRootItem
                key="info"
                icon={InfoOutlined}
                title="Info"
                onClick={openInfoDialog}
                showChevron={false}
              />,
            ]
          : null}

        {settingsView === "language"
          ? [
              <BackMenuRow
                key="back"
                onClick={() => setSettingsView("root")}
              />,
              ...LANGUAGE_CODES.map((code) => (
                <SelectableSettingRow
                  key={code}
                  label={LANGUAGE_LABELS[code]}
                  selected={nameLanguage === code}
                  onClick={() => handleLanguageChange(code)}
                />
              )),
            ]
          : null}

        {settingsView === "theme"
          ? [
              <BackMenuRow
                key="back"
                onClick={() => setSettingsView("root")}
              />,
              ...THEME_CHOICES.map(({ mode, icon }) => (
                <SelectableSettingRow
                  key={mode}
                  label={THEME_LABELS[mode]}
                  icon={icon}
                  selected={themeMode === mode}
                  onClick={() => handleThemeModeChange(mode)}
                />
              )),
            ]
          : null}
      </Menu>
      <LayoutInfoDialog
        isOpen={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
      />
    </>
  );
}
