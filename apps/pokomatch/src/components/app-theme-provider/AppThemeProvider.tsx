import { useMemo, type ReactNode } from 'react'
import { ThemeProvider, useMediaQuery } from '@mui/material'
import { createAppTheme } from '../../theme'
import { useStore } from '../../store/store'

interface AppThemeProviderProps {
  children: ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const themeMode = useStore((s) => s.themeMode)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', {
    noSsr: true,
  })
  const resolvedMode =
    themeMode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : themeMode
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode])

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
