// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeferredMount, DeferredMountGate } from "./DeferredMount";

let nextFrameId = 1;
let frameCallbacks: Map<number, FrameRequestCallback>;

function flushAnimationFrames() {
  act(() => {
    while (frameCallbacks.size > 0) {
      const callbacks = [...frameCallbacks.values()];
      frameCallbacks.clear();
      for (const callback of callbacks) callback(performance.now());
    }
  });
}

beforeEach(() => {
  nextFrameId = 1;
  frameCallbacks = new Map();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frameCallbacks.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frameCallbacks.delete(id);
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("DeferredMount", () => {
  it("shows its fallback before mounting children two frames later", async () => {
    const onReady = vi.fn();
    render(
      <DeferredMount fallback={<p>Loading section</p>} onReady={onReady}>
        <p>Heavy content</p>
      </DeferredMount>,
    );

    expect(screen.getByText("Loading section")).toBeInTheDocument();
    expect(screen.queryByText("Heavy content")).not.toBeInTheDocument();

    flushAnimationFrames();

    expect(await screen.findByText("Heavy content")).toBeInTheDocument();
    await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
  });

  it("notifies a gate only after every registered child is ready", async () => {
    const onGateReady = vi.fn();
    render(
      <DeferredMountGate onReady={onGateReady}>
        <DeferredMount fallback="First loading">
          <span>First ready</span>
        </DeferredMount>
        <DeferredMount fallback="Second loading">
          <span>Second ready</span>
        </DeferredMount>
      </DeferredMountGate>,
    );

    expect(onGateReady).not.toHaveBeenCalled();
    flushAnimationFrames();

    expect(await screen.findByText("First ready")).toBeInTheDocument();
    expect(screen.getByText("Second ready")).toBeInTheDocument();
    await waitFor(() => expect(onGateReady).toHaveBeenCalledOnce());
  });
});
