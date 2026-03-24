import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { AppThemeProvider } from './components/app-theme-provider/AppThemeProvider'
import { AppErrorBoundary } from './components/app-error-boundary/AppErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <CssBaseline />
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </AppThemeProvider>
  </StrictMode>,
)
