// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Pokemon } from "../../../types/types";
import { ShareGroupDialog } from "./ShareGroupDialog";

const mocks = vi.hoisted(() => ({
  copySharedGroupUrl: vi.fn(),
  createGroupShareImage: vi.fn(),
  downloadGroupShareImage: vi.fn(),
}));

vi.mock("../share-group", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../share-group")>()),
  copySharedGroupUrl: mocks.copySharedGroupUrl,
}));

vi.mock("../create-share-image", () => ({
  createGroupShareImage: mocks.createGroupShareImage,
  downloadGroupShareImage: mocks.downloadGroupShareImage,
}));

vi.mock("./GroupCard", () => ({
  default: () => <div data-testid="group-card" />,
}));

vi.mock("./ShareGroupImageCard", async () => {
  const { forwardRef } = await import("react");
  return {
    ShareGroupImageCard: forwardRef<HTMLDivElement>((_, ref) => (
      <div ref={ref} data-testid="share-image-card" />
    )),
  };
});

const group: Pokemon[] = [
  {
    dexKind: "standard",
    id: "001",
    dexNumber: "001",
    name: "Bulbasaur",
    specialties: ["Gather"],
    idealHabitat: "Cool",
    favorites: ["Plants"],
  },
  {
    dexKind: "standard",
    id: "004",
    dexNumber: "004",
    name: "Charmander",
    specialties: ["Burn"],
    idealHabitat: "Warm",
    favorites: ["Fire"],
  },
];

describe("ShareGroupDialog", () => {
  it("copies a group-only URL and confirms success", async () => {
    const user = userEvent.setup();
    mocks.copySharedGroupUrl.mockResolvedValue(undefined);

    render(<ShareGroupDialog group={group} groupNumber={1} open onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() =>
      expect(mocks.copySharedGroupUrl).toHaveBeenCalledWith(
        "http://localhost/matchmaker?group=001%2C004",
      ),
    );
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("renders and downloads the hidden, real group-card image", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["image"], { type: "image/png" });
    mocks.createGroupShareImage.mockResolvedValue(blob);

    render(<ShareGroupDialog group={group} groupNumber={1} open onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Share as image" }));

    await waitFor(() => expect(mocks.createGroupShareImage).toHaveBeenCalledOnce());
    expect(mocks.createGroupShareImage).toHaveBeenCalledWith(
      screen.getByTestId("share-image-card"),
    );
    expect(mocks.downloadGroupShareImage).toHaveBeenCalledWith(blob);
    expect(await screen.findByText("Share image downloaded.")).toBeInTheDocument();
  });
});
