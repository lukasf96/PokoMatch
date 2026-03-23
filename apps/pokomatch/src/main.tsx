import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { useMemo } from 'react'
import { createAppTheme } from './theme'
import { useStore } from './store/store'
import { AppErrorBoundary } from './components/app-error-boundary/AppErrorBoundary'

function AppThemeProvider() {
  const themeMode = useStore((s) => s.themeMode)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', {
    noSsr: true,
  })
  const resolvedMode =
    themeMode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : themeMode
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider />
  </StrictMode>,
)
