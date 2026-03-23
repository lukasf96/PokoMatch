import { Button, Paper, Stack, Typography } from '@mui/material'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled app error', error, info)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Stack
        sx={{
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'background.default',
        }}
      >
        <Paper sx={{ p: 3, width: '100%', maxWidth: 480 }}>
          <Stack spacing={1.25}>
            <Typography variant="h6">Something went wrong</Typography>
            <Typography variant="body2" color="text.secondary">
              PokoMatch hit an unexpected error. Reload to continue.
            </Typography>
            <Button variant="contained" onClick={this.handleReload}>
              Reload app
            </Button>
          </Stack>
        </Paper>
      </Stack>
    )
  }
}
