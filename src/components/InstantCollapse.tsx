import type { CollapseProps } from "@mui/material/Collapse";

/** Skip Collapse height animation — large group/card trees make it laggy. */
export function InstantCollapse({
  in: inProp = false,
  children,
}: CollapseProps) {
  return <div style={{ display: inProp ? "block" : "none" }}>{children}</div>;
}
