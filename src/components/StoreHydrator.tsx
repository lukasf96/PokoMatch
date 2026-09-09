import { useEffect, type ReactNode } from "react";
import { rehydrateStore } from "../store/store";

/** Keep inside the route Suspense boundary so saved state restores only after it hydrates. */
export function StoreHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    void rehydrateStore();
  }, []);

  return children;
}
