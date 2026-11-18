import { Alert, Button, Snackbar } from "@mui/material";
import Portal from "@mui/material/Portal";

export type ToastState = {
  message: string;
  severity: "success" | "error" | "info";
  /** Optional inline action, e.g. Undo. */
  action?: { label: string; onClick: () => void };
} | null;

interface AppToastProps {
  toast: ToastState;
  onClose: () => void;
}

export function AppToast({ toast, onClose }: AppToastProps) {
  return (
    <Portal>
      <Snackbar
        open={toast != null}
        autoHideDuration={toast?.action ? 8000 : 4000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          onClose();
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            onClose={onClose}
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%", alignItems: "center" }}
            action={
              toast.action ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    toast.action?.onClick();
                    onClose();
                  }}
                  sx={{ fontWeight: 700 }}
                >
                  {toast.action.label}
                </Button>
              ) : undefined
            }
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Portal>
  );
}
