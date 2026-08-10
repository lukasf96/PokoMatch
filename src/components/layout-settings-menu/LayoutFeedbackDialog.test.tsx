// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LayoutFeedbackDialog } from "./LayoutFeedbackDialog";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("LayoutFeedbackDialog", () => {
  it("explains missing configuration and prevents an unusable submission", async () => {
    vi.stubEnv("VITE_WEB3FORMS_ACCESS_KEY", "");
    vi.stubEnv("VITE_HCAPTCHA_SITEKEY", "");
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LayoutFeedbackDialog isOpen onClose={onClose} />);

    expect(
      screen.getByText(/in-app form is not configured in this build/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /name/i })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /message/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
