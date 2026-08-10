// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "../../store/store";
import {
  decodeTransferString,
  encodeTransferData,
} from "../../utils/data-transfer";
import { LayoutDataTransferDialog } from "./LayoutDataTransferDialog";

beforeEach(() => {
  localStorage.clear();
  useStore.setState({
    unlockedIds: new Set(["001"]),
    customGroups: [{ id: "current", pokemonIds: ["001"] }],
  });
});

describe("LayoutDataTransferDialog", () => {
  it("exports current data and reports successful clipboard copying", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<LayoutDataTransferDialog isOpen onClose={vi.fn()} />);

    const textboxes = screen.getAllByRole("textbox");
    const exportString = (textboxes[0] as HTMLTextAreaElement).value;
    expect(decodeTransferString(exportString)).toEqual({
      ok: true,
      data: {
        unlockedIds: ["001"],
        customGroups: [{ id: "current", pokemonIds: ["001"] }],
      },
    });

    await user.click(screen.getByRole("button", { name: /copy export string/i }));

    expect(writeText).toHaveBeenCalledWith(exportString);
    expect(await screen.findByText("Export string copied")).toBeInTheDocument();
  });

  it("shows validation errors without replacing current data", async () => {
    const user = userEvent.setup();
    render(<LayoutDataTransferDialog isOpen onClose={vi.fn()} />);

    await user.type(screen.getAllByRole("textbox")[1], "not-a-transfer");
    await user.click(screen.getByRole("button", { name: /import and replace/i }));

    expect(await screen.findByText(/doesn.t look like a PokoMatch transfer string/i)).toBeInTheDocument();
    expect(useStore.getState().unlockedIds).toEqual(new Set(["001"]));
    expect(screen.queryByRole("dialog", { name: "Replace local data?" })).not.toBeInTheDocument();
  });

  it("sanitizes and replaces collection data only after confirmation", async () => {
    const user = userEvent.setup();
    const transfer = encodeTransferData({
      unlockedIds: ["001", "004", "unknown"],
      customGroups: [
        {
          id: "imported",
          pokemonIds: ["004", "unknown"],
          location: "Palette Town",
        },
      ],
    });
    render(<LayoutDataTransferDialog isOpen onClose={vi.fn()} />);

    await user.type(screen.getAllByRole("textbox")[1], transfer);
    await user.click(screen.getByRole("button", { name: /import and replace/i }));

    const confirmation = await screen.findByRole("dialog", {
      name: "Replace local data?",
    });
    expect(within(confirmation).getByText(/2 unlocked, 1 groups/i)).toBeInTheDocument();
    expect(useStore.getState().customGroups[0]?.id).toBe("current");

    await user.click(within(confirmation).getByRole("button", { name: "Replace" }));

    expect(useStore.getState().unlockedIds).toEqual(new Set(["001", "004"]));
    expect(useStore.getState().customGroups).toEqual([
      {
        id: "imported",
        pokemonIds: ["004"],
        location: "Palette Town",
      },
    ]);
    expect(await screen.findByText("Pokédex and saved groups replaced")).toBeInTheDocument();
  });
});
