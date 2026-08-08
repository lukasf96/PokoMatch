import { useEffect, useState, useTransition, type ReactNode } from "react";
import { ContentSkeleton } from "./ContentSkeleton";

interface DeferredMountProps {
  children: ReactNode;
  /** Placeholder shown until the deferred content mounts. */
  fallback?: ReactNode;
}

/**
 * Paint the surrounding page shell first, then mount expensive children on the
 * next frame inside a transition. Keeps route changes feeling instant even when
 * the destination page has a heavy first render (e.g. hundreds of cards/rows).
 */
export function DeferredMount({ children, fallback }: DeferredMountProps) {
  const [ready, setReady] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        startTransition(() => setReady(true));
      });
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [startTransition]);

  if (!ready) {
    return fallback ?? <ContentSkeleton />;
  }

  return children;
}
