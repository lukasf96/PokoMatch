// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGroupShareImage,
  downloadGroupShareImage,
} from "./create-share-image";

const toBlob = vi.hoisted(() => vi.fn());

vi.mock("html-to-image", () => ({ toBlob }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("share image export", () => {
  it("renders the supplied card at a high-resolution PNG scale", async () => {
    const element = document.createElement("div");
    const blob = new Blob(["image"], { type: "image/png" });
    toBlob.mockResolvedValue(blob);

    await expect(createGroupShareImage(element)).resolves.toBe(blob);
    expect(toBlob).toHaveBeenCalledWith(element, {
      backgroundColor: "#fffbf4",
      cacheBust: true,
      pixelRatio: 2,
    });
  });

  it("reports an error when image rendering produces no blob", async () => {
    toBlob.mockResolvedValue(null);

    await expect(createGroupShareImage(document.createElement("div"))).rejects.toThrow(
      "Could not create the share image.",
    );
  });

  it("downloads the generated image with the PokoMatch filename", () => {
    const blob = new Blob(["image"], { type: "image/png" });
    const createObjectURL = vi.fn(() => "blob:share-image");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    downloadGroupShareImage(blob);

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:share-image");
  });
});
