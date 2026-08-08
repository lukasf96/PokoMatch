import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { ContentSkeleton } from "./ContentSkeleton";

interface DeferredMountProps {
  children: ReactNode;
  /** Placeholder shown until the deferred content mounts. */
  fallback?: ReactNode;
  /** Fired once when this instance swaps from fallback to children. */
  onReady?: () => void;
}

interface DeferredMountGateContextValue {
  register: (id: string) => () => void;
  reportReady: (id: string) => void;
}

const DeferredMountGateContext =
  createContext<DeferredMountGateContextValue | null>(null);

interface DeferredMountGateProps {
  children: ReactNode;
  /** Fired once when every registered DeferredMount inside has become ready. */
  onReady?: () => void;
}

/**
 * Tracks nested {@link DeferredMount} instances and notifies when all of them
 * have finished mounting their children — useful before hash scrolling.
 */
export function DeferredMountGate({
  children,
  onReady,
}: DeferredMountGateProps) {
  const registeredRef = useRef(new Set<string>());
  const readyRef = useRef(new Set<string>());
  const notifiedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const tryNotify = useCallback(() => {
    if (notifiedRef.current) return;
    const registered = registeredRef.current;
    const ready = readyRef.current;
    if (registered.size === 0) return;
    for (const id of registered) {
      if (!ready.has(id)) return;
    }
    notifiedRef.current = true;
    onReadyRef.current?.();
  }, []);

  const value = useMemo<DeferredMountGateContextValue>(
    () => ({
      register: (id: string) => {
        registeredRef.current.add(id);
        return () => {
          registeredRef.current.delete(id);
          readyRef.current.delete(id);
        };
      },
      reportReady: (id: string) => {
        readyRef.current.add(id);
        tryNotify();
      },
    }),
    [tryNotify],
  );

  return (
    <DeferredMountGateContext.Provider value={value}>
      {children}
    </DeferredMountGateContext.Provider>
  );
}

/**
 * Paint the surrounding page shell first, then mount expensive children on the
 * next frame inside a transition. Keeps route changes feeling instant even when
 * the destination page has a heavy first render (e.g. hundreds of cards/rows).
 */
export function DeferredMount({
  children,
  fallback,
  onReady,
}: DeferredMountProps) {
  const mountId = useId();
  const [ready, setReady] = useState(false);
  const [, startTransition] = useTransition();
  const gate = useContext(DeferredMountGateContext);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const notifiedRef = useRef(false);

  useLayoutEffect(() => {
    return gate?.register(mountId);
  }, [gate, mountId]);

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

  useEffect(() => {
    if (!ready || notifiedRef.current) return;
    notifiedRef.current = true;
    onReadyRef.current?.();
    gate?.reportReady(mountId);
  }, [ready, gate, mountId]);

  if (!ready) {
    return fallback ?? <ContentSkeleton />;
  }

  return children;
}
