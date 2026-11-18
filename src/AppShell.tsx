import type { ReactNode } from "react";
import Layout from "./Layout";
import { DocumentTitle } from "./router/DocumentTitle";

export function AppShell({ children, preloadRoute }: {
  children: ReactNode;
  preloadRoute?: (path: string) => void;
}) {
  return (
    <>
      <DocumentTitle />
      <Layout preloadRoute={preloadRoute}>{children}</Layout>
    </>
  );
}
