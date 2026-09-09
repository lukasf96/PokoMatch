import type { ReactNode } from "react";
import Layout from "./Layout";
import { DocumentTitle } from "./router/DocumentTitle";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <DocumentTitle />
      <Layout>{children}</Layout>
    </>
  );
}
