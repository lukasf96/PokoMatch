import { Alert, Snackbar } from "@mui/material";
import Portal from "@mui/material/Portal";

export type ToastState = {
  message: string;
  severity: "success" | "error" | "info";
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
        autoHideDuration={4000}
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
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Portal>
  );
}
