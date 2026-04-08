import { alpha, createTheme, type PaletteMode } from '@mui/material/styles'

/** Shadcn-inspired: crisp borders, soft elevation, pill chips — with a neutral blue palette. */
function getThemeTokens(mode: PaletteMode) {
  const isDark = mode === 'dark'
  const borderSubtle = isDark ? 'hsl(240 6% 26%)' : 'hsl(240 6% 90%)'
  const surfaceMuted = isDark ? 'hsl(240 10% 8%)' : 'hsl(250 42% 98%)'

  return {
    isDark,
    borderSubtle,
    surfaceMuted,
    backgroundPaper: isDark ? 'hsl(240 10% 12%)' : '#ffffff',
    divider: isDark ? alpha('#e2e8f0', 0.16) : alpha('#0f172a', 0.08),
    textPrimary: isDark ? 'hsl(210 20% 96%)' : 'hsl(240 10% 10%)',
    textSecondary: isDark ? 'hsl(215 14% 72%)' : 'hsl(240 4% 46%)',
    textDisabled: isDark ? 'hsl(215 14% 55%)' : 'hsl(240 4% 64%)',
    actionHover: isDark ? alpha('#60a5fa', 0.16) : alpha('#2563eb', 0.07),
    actionSelected: isDark ? alpha('#60a5fa', 0.24) : alpha('#2563eb', 0.12),
    shadowColor: isDark ? '2 6 23' : '15 23 42',
  }
}

export function createAppTheme(mode: PaletteMode) {
  const tokens = getThemeTokens(mode)

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f766e',
      light: '#ccfbf1',
      dark: '#115e59',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      light: '#dcfce7',
      dark: '#15803d',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ea580c',
      light: '#ffedd5',
      dark: '#c2410c',
      contrastText: '#ffffff',
    },
    error: {
      main: '#e11d48',
      light: '#ffe4e6',
      dark: '#be123c',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0891b2',
      light: '#cffafe',
      dark: '#0e7490',
      contrastText: '#ffffff',
    },
      background: {
        default: tokens.surfaceMuted,
        paper: tokens.backgroundPaper,
      },
      divider: tokens.divider,
      text: {
        primary: tokens.textPrimary,
        secondary: tokens.textSecondary,
        disabled: tokens.textDisabled,
      },
      action: {
        hover: tokens.actionHover,
        selected: tokens.actionSelected,
      },
    grey: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },
  },
    shape: {
      borderRadius: 10,
    },
    shadows: [
      'none',
      `0 1px 2px 0 rgb(${tokens.shadowColor} / 0.05)`,
      `0 1px 3px 0 rgb(${tokens.shadowColor} / 0.08), 0 1px 2px -1px rgb(${tokens.shadowColor} / 0.08)`,
      `0 4px 6px -1px rgb(${tokens.shadowColor} / 0.08), 0 2px 4px -2px rgb(${tokens.shadowColor} / 0.06)`,
      `0 10px 15px -3px rgb(${tokens.shadowColor} / 0.08), 0 4px 6px -4px rgb(${tokens.shadowColor} / 0.05)`,
      `0 20px 25px -5px rgb(${tokens.shadowColor} / 0.08), 0 8px 10px -6px rgb(${tokens.shadowColor} / 0.05)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.2)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.22)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.24)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.26)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.28)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.3)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.32)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.34)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.36)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.38)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.4)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.42)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.44)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.46)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.48)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.5)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.52)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.54)`,
      `0 25px 50px -12px rgb(${tokens.shadowColor} / 0.56)`,
    ],
    typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
  },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.surfaceMuted,
            WebkitFontSmoothing: 'antialiased',
          },
        },
      },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: tokens.borderSubtle,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
        },
        containedPrimary: {
          boxShadow: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
          '&:hover': {
            boxShadow: '0 2px 4px -1px rgb(15 23 42 / 0.1)',
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          border: `1px solid ${tokens.borderSubtle}`,
          '&.Mui-selected': {
            backgroundColor: alpha('#2563eb', tokens.isDark ? 0.3 : 0.12),
            color: tokens.isDark ? '#93c5fd' : '#1d4ed8',
            borderColor: alpha('#2563eb', 0.35),
            '&:hover': {
              backgroundColor: alpha('#2563eb', tokens.isDark ? 0.36 : 0.16),
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 9999,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.borderSubtle}`,
          borderRadius: 10,
          '&:before': {
            display: 'none',
          },
          boxShadow: 'none',
        },
      },
    },
    MuiSwitch: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiSwitch-switchBase:not(.Mui-checked) .MuiSwitch-thumb': {
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 0 0 1px rgba(15, 23, 42, 0.12)'
                : undefined,
          },
          '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
            backgroundColor:
              theme.palette.mode === 'light'
                ? theme.palette.grey[400]
                : theme.palette.grey[700],
            opacity: 1,
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: tokens.backgroundPaper,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: tokens.divider,
        },
      },
    },
  },
  })
}
