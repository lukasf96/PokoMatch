// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  AutoGroupsRequest,
  AutoGroupsResponse,
} from "./matching.worker";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("matching worker protocol", () => {
  it("filters unknown IDs and posts grouped IDs with the matching request ID", async () => {
    const postMessage = vi.fn();
    const workerScope: {
      onmessage?: (event: MessageEvent<AutoGroupsRequest>) => void;
      postMessage: typeof postMessage;
    } = { postMessage };
    vi.stubGlobal("self", workerScope);
    await import("./matching.worker");

    workerScope.onmessage?.({
      data: {
        requestId: 42,
        pokemonIds: ["001", "002", "003", "unknown"],
        preferEvolutionLines: true,
      },
    } as MessageEvent<AutoGroupsRequest>);

    expect(postMessage).toHaveBeenCalledOnce();
    const response = postMessage.mock.calls[0]?.[0] as AutoGroupsResponse;
    expect(response.requestId).toBe(42);
    expect(response.groupIds.flat().sort()).toEqual(["001", "002", "003"]);
    expect(response.groupIds.every((group) => group.length <= 4)).toBe(true);
  });
});
