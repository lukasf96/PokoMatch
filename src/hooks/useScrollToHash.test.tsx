// @vitest-environment jsdom

import { act, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollToHash } from "./useScrollToHash";

let frameCallbacks: FrameRequestCallback[];

function flushAnimationFrames() {
  act(() => {
    while (frameCallbacks.length > 0) {
      const callbacks = frameCallbacks;
      frameCallbacks = [];
      for (const callback of callbacks) callback(performance.now());
    }
  });
}

function Harness({ contentReady, onHash }: { contentReady: boolean; onHash: (id: string) => void }) {
  useScrollToHash({ contentReady, behavior: "auto", block: "center", onHash });
  return <section id="target">Target</section>;
}

beforeEach(() => {
  frameCallbacks = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frameCallbacks.push(callback);
    return frameCallbacks.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => vi.unstubAllGlobals());

describe("useScrollToHash", () => {
  it("prepares the target immediately but waits for content readiness to scroll", async () => {
    const onHash = vi.fn();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { rerender } = render(
      <MemoryRouter initialEntries={["/page#target"]}>
        <Harness contentReady={false} onHash={onHash} />
      </MemoryRouter>,
    );

    expect(onHash).toHaveBeenCalledWith("target");
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter initialEntries={["/page#target"]}>
        <Harness contentReady onHash={onHash} />
      </MemoryRouter>,
    );
    flushAnimationFrames();

    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "center" }),
    );
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it("does nothing when the route has no hash", () => {
    const onHash = vi.fn();
    render(
      <MemoryRouter initialEntries={["/page"]}>
        <Harness contentReady onHash={onHash} />
      </MemoryRouter>,
    );

    flushAnimationFrames();
    expect(onHash).not.toHaveBeenCalled();
  });
});
