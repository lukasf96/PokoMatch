import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { AppToast, type ToastState } from "../../../components/AppToast";
import type { Pokemon } from "../../../types/types";
import {
  createGroupShareImage,
  downloadGroupShareImage,
} from "../create-share-image";
import { getDisplayHabitat } from "../group-helpers";
import { copySharedGroupUrl, createSharedGroupUrl } from "../share-group";
import GroupCard from "./GroupCard";
import { ShareGroupImageCard } from "./ShareGroupImageCard";

interface ShareGroupDialogProps {
  group: Pokemon[];
  groupNumber: number;
  open: boolean;
  onClose: () => void;
}

export function ShareGroupDialog({
  group,
  groupNumber,
  open,
  onClose,
}: ShareGroupDialogProps) {
  const [toast, setToast] = useState<ToastState>(null);
  const [isCreatingImage, setIsCreatingImage] = useState(false);
  const shareImageRef = useRef<HTMLDivElement>(null);
  const habitat = getDisplayHabitat(group);
  const shareUrl = createSharedGroupUrl({
    pokemonIds: group.map((pokemon) => pokemon.id),
  });

  const copyLink = async () => {
    try {
      await copySharedGroupUrl(shareUrl);
      setToast({ message: "Link copied", severity: "success" });
    } catch {
      setToast({
        message: "Could not copy the link. Please try again.",
        severity: "error",
      });
    }
  };
  const shareImage = async () => {
    setIsCreatingImage(true);
    try {
      if (!shareImageRef.current)
        throw new Error("Could not prepare the share image.");
      downloadGroupShareImage(
        await createGroupShareImage(shareImageRef.current),
      );
      setToast({ message: "Share image downloaded.", severity: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Could not create the share image.",
        severity: "error",
      });
    } finally {
      setIsCreatingImage(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="share-group-title"
      >
        <DialogTitle id="share-group-title" sx={{ fontWeight: 900 }}>
          Share this habitat group
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25}>
            <Typography color="text.secondary">
              Share your group with another player. PokoMatch never shares your
              save, settings, or identity.
            </Typography>
            <Box sx={{ pointerEvents: "none", "& button": { display: "none" } }}>
              <GroupCard
                group={group}
                groupNumber={groupNumber}
                habitat={habitat}
              />
            </Box>
            <Box
              aria-hidden="true"
              sx={{
                position: "fixed",
                left: -10000,
                top: 0,
                width: 1200,
                pointerEvents: "none",
              }}
            >
              <ShareGroupImageCard ref={shareImageRef} group={group} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={onClose}>Done</Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyOutlinedIcon />}
            onClick={() => void copyLink()}
          >
            Copy link
          </Button>
          <Button
            variant="contained"
            startIcon={<ImageOutlinedIcon />}
            onClick={() => void shareImage()}
            disabled={isCreatingImage}
          >
            {isCreatingImage ? "Creating image…" : "Share as image"}
          </Button>
        </DialogActions>
      </Dialog>
      <AppToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
