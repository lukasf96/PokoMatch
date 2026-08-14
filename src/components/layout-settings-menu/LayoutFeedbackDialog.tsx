import HCaptcha from "@hcaptcha/react-hcaptcha";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { AppToast, type ToastState } from "../AppToast";
import {
  FEEDBACK_LIMITS,
  getHCaptchaSiteKey,
  isFeedbackConfigured,
  submitFeedback,
} from "../../utils/feedback";

interface LayoutFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayoutFeedbackDialog({
  isOpen,
  onClose,
}: LayoutFeedbackDialogProps) {
  const theme = useTheme();
  const captchaRef = useRef<HCaptcha>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [openedAt, setOpenedAt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const configured = isFeedbackConfigured();
  const hcaptchaSiteKey = getHCaptchaSiteKey();

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setMessage("");
      setHoneypot("");
      setCaptchaToken("");
      setIsSubmitting(false);
      captchaRef.current?.resetCaptcha();
      return;
    }
    setOpenedAt(Date.now());
  }, [isOpen]);

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        name,
        email,
        message,
        website: honeypot,
        captchaToken,
        openedAt,
      });

      if (!result.ok) {
        setToast({ message: result.error, severity: "error" });
        captchaRef.current?.resetCaptcha();
        setCaptchaToken("");
        return;
      }

      setToast({
        message: "Thanks — your feedback was sent.",
        severity: "success",
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Feedback</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.75} component="form" noValidate>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Questions, bugs, or ideas? Send a note below.
            </Typography>

            {!configured ? (
              <Alert severity="info">
                The in-app form is not configured in this build. Set{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontFamily: "monospace" }}
                >
                  VITE_WEB3FORMS_ACCESS_KEY
                </Typography>{" "}
                and{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontFamily: "monospace" }}
                >
                  VITE_HCAPTCHA_SITEKEY
                </Typography>{" "}
                when building.
              </Alert>
            ) : null}

            {/* Honeypot — hidden from users, left alone by real visitors */}
            <TextField
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              label="Website"
              name="website"
              slotProps={{
                htmlInput: { "aria-hidden": true },
              }}
              sx={{
                position: "absolute",
                left: "-10000px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            />

            <TextField
              label="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
              disabled={!configured || isSubmitting}
              slotProps={{
                htmlInput: { maxLength: FEEDBACK_LIMITS.maxNameLength },
              }}
            />
            <TextField
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              disabled={!configured || isSubmitting}
              slotProps={{
                htmlInput: { maxLength: FEEDBACK_LIMITS.maxEmailLength },
              }}
            />
            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              required
              multiline
              minRows={4}
              disabled={!configured || isSubmitting}
              slotProps={{
                htmlInput: { maxLength: FEEDBACK_LIMITS.maxMessageLength },
              }}
              helperText={`${message.trim().length}/${FEEDBACK_LIMITS.maxMessageLength}`}
            />

            {configured && hcaptchaSiteKey ? (
              <HCaptcha
                ref={captchaRef}
                sitekey={hcaptchaSiteKey}
                reCaptchaCompat={false}
                theme={theme.palette.mode}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => void handleSubmit()}
            disabled={
              !configured ||
              isSubmitting ||
              !captchaToken ||
              message.trim().length < FEEDBACK_LIMITS.minMessageLength
            }
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {isSubmitting ? "Sending…" : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
