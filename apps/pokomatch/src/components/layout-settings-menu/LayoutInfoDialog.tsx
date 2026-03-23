import { GitHub } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from "@mui/material";

interface LayoutInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const REPOSITORY_URL = "https://github.com/lukasf96/pokopia";
const POKE_API_URL = "https://pokeapi.co/";
const POKE_API_SPRITES_URL = "https://github.com/PokeAPI/sprites";

export function LayoutInfoDialog({ isOpen, onClose }: LayoutInfoDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Info</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.25}>
          <Typography variant="body2" color="text.secondary">
            Pokomatch.com
          </Typography>
          <Link
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            underline="hover"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              typography: "caption",
            }}
          >
            <GitHub fontSize="small" />
            View on GitHub
          </Link>
          <br></br>
          <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
            Credits / Special thanks to:
          </Typography>
          <Typography variant="body2">
            Pokemon data and localized species names:{" "}
            <Link href={POKE_API_URL} target="_blank" rel="noreferrer">
              PokeAPI
            </Link>
          </Typography>
          <Typography variant="body2">
            Sprite source:{" "}
            <Link href={POKE_API_SPRITES_URL} target="_blank" rel="noreferrer">
              PokeAPI/sprites
            </Link>
          </Typography>
          <br></br>
          <Typography variant="caption" color="text.secondary">
            PokoMatch is a fan-made project and is not affiliated with,
            endorsed, sponsored, or specifically approved by Nintendo, GAME
            FREAK or The Pokemon Company.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
