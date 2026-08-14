import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { AppToast, type ToastState } from "../AppToast";
import { allPokemon } from "../../services/pokemon";
import { useStore } from "../../store/store";
import {
  decodeTransferString,
  encodeTransferData,
  sanitizeTransferData,
  type TransferData,
} from "../../utils/data-transfer";

interface LayoutDataTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const knownIds = new Set(allPokemon.map((pokemon) => pokemon.id));

export function LayoutDataTransferDialog({
  isOpen,
  onClose,
}: LayoutDataTransferDialogProps) {
  const unlockedIds = useStore((s) => s.unlockedIds);
  const customGroups = useStore((s) => s.customGroups);
  const replaceCollectionData = useStore((s) => s.replaceCollectionData);

  const exportString = useMemo(
    () =>
      encodeTransferData({
        unlockedIds: [...unlockedIds],
        customGroups,
      }),
    [unlockedIds, customGroups],
  );

  const [importText, setImportText] = useState("");
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<TransferData | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!isOpen) {
      setImportText("");
      setConfirmReplaceOpen(false);
      setPendingImport(null);
    }
  }, [isOpen]);

  async function handleCopyExport() {
    try {
      await navigator.clipboard.writeText(exportString);
      setToast({ message: "Export string copied", severity: "success" });
    } catch {
      setToast({
        message: "Could not copy — select the text and copy manually",
        severity: "error",
      });
    }
  }

  function handlePrepareImport() {
    const decoded = decodeTransferString(importText);
    if (!decoded.ok) {
      setToast({ message: decoded.error, severity: "error" });
      return;
    }

    const sanitized = sanitizeTransferData(decoded.data, knownIds);
    setPendingImport(sanitized);
    setConfirmReplaceOpen(true);
  }

  function handleConfirmImport() {
    if (!pendingImport) return;
    replaceCollectionData(pendingImport);
    setConfirmReplaceOpen(false);
    setPendingImport(null);
    setImportText("");
    setToast({
      message: "Pokédex and saved groups replaced",
      severity: "success",
    });
  }

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Export / Import</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Export</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Copy this string to transfer your Pokédex progress and saved
                groups to another device.
              </Typography>
              <TextField
                value={exportString}
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                slotProps={{
                  input: {
                    readOnly: true,
                    sx: {
                      typography: "caption",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      wordBreak: "break-all",
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<ContentCopyOutlined />}
                onClick={() => void handleCopyExport()}
                sx={{ alignSelf: "flex-start" }}
              >
                Copy export string
              </Button>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Import</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Paste a transfer string from another device. This replaces your
                current Pokédex and saved groups.
              </Typography>
              <TextField
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                placeholder="PKM1.…"
                slotProps={{
                  input: {
                    sx: {
                      typography: "caption",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      wordBreak: "break-all",
                    },
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={handlePrepareImport}
                disabled={importText.trim().length === 0}
                sx={{ alignSelf: "flex-start" }}
              >
                Import and replace
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmReplaceOpen}
        onClose={() => {
          setConfirmReplaceOpen(false);
          setPendingImport(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Replace local data?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Your current Pokédex progress and saved groups will be replaced by
            the imported data
            {pendingImport
              ? ` (${pendingImport.unlockedIds.length} unlocked, ${pendingImport.customGroups.length} groups)`
              : ""}
            . This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmReplaceOpen(false);
              setPendingImport(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={handleConfirmImport}>
            Replace
          </Button>
        </DialogActions>
      </Dialog>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
