import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Fab } from "@mui/material";
import { useCallback, useSyncExternalStore } from "react";

function subscribeWindowScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function getWindowScrollY() {
  return window.scrollY;
}

const SCROLL_TOP_THRESHOLD = 120;

export function ScrollToTopFab() {
  const scrollY = useSyncExternalStore(
    subscribeWindowScroll,
    getWindowScrollY,
    () => 0,
  );
  const show = scrollY > SCROLL_TOP_THRESHOLD;

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <Fab
      color="primary"
      size="medium"
      aria-label="Scroll back to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      onClick={scrollToTop}
      sx={{
        position: "fixed",
        right: { xs: 16, sm: 24 },
        bottom: { xs: 16, sm: 24 },
        zIndex: (theme) => theme.zIndex.speedDial,
        opacity: show ? 1 : 0,
        transform: show
          ? "scale(1) translateY(0)"
          : "scale(0.88) translateY(10px)",
        pointerEvents: show ? "auto" : "none",
        transition: (theme) =>
          theme.transitions.create(["opacity", "transform"], {
            duration: 200,
            easing: theme.transitions.easing.easeOut,
          }),
      }}
    >
      <KeyboardArrowUpIcon />
    </Fab>
  );
}
