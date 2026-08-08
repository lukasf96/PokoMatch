import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export interface UseScrollToHashOptions {
  /**
   * When false, wait — e.g. deferred content above the target is still mounting
   * and would invalidate the scroll position.
   */
  contentReady?: boolean;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  /** Called when the hash targets an element id (without '#'). */
  onHash?: (id: string) => void;
}

/**
 * Scrolls to `location.hash` once, after `contentReady` is true and the target
 * element exists. Safe with lazy routes and deferred mounts that change layout.
 */
export function useScrollToHash({
  contentReady = true,
  behavior = "smooth",
  block = "start",
  onHash,
}: UseScrollToHashOptions = {}): void {
  const { hash } = useLocation();
  const onHashRef = useRef(onHash);
  onHashRef.current = onHash;
  const scrolledForHashRef = useRef<string | null>(null);

  // Expand / prepare target as soon as the hash is known (don't wait for content).
  useEffect(() => {
    const id = hash.startsWith("#") ? hash.slice(1) : "";
    if (!id) return;
    onHashRef.current?.(id);
  }, [hash]);

  useEffect(() => {
    const id = hash.startsWith("#") ? hash.slice(1) : "";
    if (!id || !contentReady) return;
    if (scrolledForHashRef.current === hash) return;

    let cancelled = false;
    let tries = 0;

    const attempt = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (!el) {
        if (tries++ < 90) requestAnimationFrame(attempt);
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          el.scrollIntoView({ behavior, block });
          scrolledForHashRef.current = hash;
        });
      });
    };

    attempt();
    return () => {
      cancelled = true;
    };
  }, [hash, contentReady, behavior, block]);
}
