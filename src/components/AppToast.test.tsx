// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppToast } from "./AppToast";

describe("AppToast", () => {
  it("runs the action and closes when the action button is pressed", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onClose = vi.fn();
    render(
      <AppToast
        toast={{
          message: "Group removed",
          severity: "success",
          action: { label: "Undo", onClick: onUndo },
        }}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
