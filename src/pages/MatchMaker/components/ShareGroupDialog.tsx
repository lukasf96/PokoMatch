import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";
import type { Pokemon } from "../../../types/types";
import { getDisplayHabitat } from "../group-helpers";
import { createGroupShareImage, downloadGroupShareImage } from "../create-share-image";
import { copySharedGroupUrl, createSharedGroupUrl } from "../share-group";
import GroupCard from "./GroupCard";
import { ShareGroupImageCard } from "./ShareGroupImageCard";

interface ShareGroupDialogProps {
  group: Pokemon[];
  groupNumber: number;
  open: boolean;
  onClose: () => void;
}

export function ShareGroupDialog({ group, groupNumber, open, onClose }: ShareGroupDialogProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isCreatingImage, setIsCreatingImage] = useState(false);
  const shareImageRef = useRef<HTMLDivElement>(null);
  const habitat = getDisplayHabitat(group);
  const shareUrl = createSharedGroupUrl({ pokemonIds: group.map((pokemon) => pokemon.id) });

  const copyLink = async () => {
    try {
      await copySharedGroupUrl(shareUrl);
      setStatus("Link copied — it only includes this Pokémon group.");
    } catch {
      setStatus("Could not copy the link. Please try again.");
    }
  };
  const shareImage = async () => {
    setIsCreatingImage(true);
    try {
      if (!shareImageRef.current) throw new Error("Could not prepare the share image.");
      downloadGroupShareImage(await createGroupShareImage(shareImageRef.current));
      setStatus("Share image downloaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create the share image.");
    } finally {
      setIsCreatingImage(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="share-group-title">
      <DialogTitle id="share-group-title" sx={{ fontWeight: 900 }}>Share this habitat group</DialogTitle>
      <DialogContent>
        <Stack spacing={2.25}>
          <Typography color="text.secondary">
            Give another player a ready-to-remix group. PokoMatch never shares your save, settings, or identity.
          </Typography>
          <Box sx={{ pointerEvents: "none", "& button": { display: "none" } }}>
            <GroupCard group={group} groupNumber={groupNumber} habitat={habitat} />
          </Box>
          <Box
            aria-hidden="true"
            sx={{ position: "fixed", left: -10000, top: 0, width: 1200, pointerEvents: "none" }}
          >
            <ShareGroupImageCard ref={shareImageRef} group={group} />
          </Box>
          {status ? <Alert severity={status.startsWith("Could") ? "error" : "success"}>{status}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose}>Done</Button>
        <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={() => void copyLink()}>
          Copy link
        </Button>
        <Button variant="contained" startIcon={<ImageOutlinedIcon />} onClick={() => void shareImage()} disabled={isCreatingImage}>
          {isCreatingImage ? "Creating image…" : "Share as image"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
