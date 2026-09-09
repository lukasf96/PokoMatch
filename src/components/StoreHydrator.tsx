import { useEffect, type ReactNode } from "react";
import { rehydrateStore } from "../store/store";

/** Restores browser-only persisted state after the server HTML has hydrated. */
export function StoreHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    void rehydrateStore();
  }, []);

  return children;
}
