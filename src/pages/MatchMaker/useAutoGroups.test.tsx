// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AutoGroupsResponse } from "../../services/matching.worker";
import type { Pokemon } from "../../types/types";
import { useAutoGroups } from "./useAutoGroups";

class MockWorker {
  static instances: MockWorker[] = [];

  readonly posted: unknown[] = [];
  readonly listeners = new Set<(event: MessageEvent<AutoGroupsResponse>) => void>();
  readonly terminate = vi.fn();

  constructor() {
    MockWorker.instances.push(this);
  }

  postMessage(message: unknown) {
    this.posted.push(message);
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent<AutoGroupsResponse>) => void,
  ) {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(
    type: string,
    listener: (event: MessageEvent<AutoGroupsResponse>) => void,
  ) {
    if (type === "message") this.listeners.delete(listener);
  }

  respond(data: AutoGroupsResponse) {
    const event = { data } as MessageEvent<AutoGroupsResponse>;
    for (const listener of this.listeners) listener(event);
  }
}

function pokemon(id: string): Pokemon {
  return {
    dexKind: "standard",
    id,
    dexNumber: id,
    name: id,
    specialties: [],
    idealHabitat: "Bright",
    favorites: [],
  };
}

beforeEach(() => {
  MockWorker.instances = [];
  vi.stubGlobal("Worker", MockWorker);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAutoGroups", () => {
  it("posts IDs and maps worker responses back to the original Pokemon objects", async () => {
    const first = pokemon("001");
    const second = pokemon("004");
    const { result } = renderHook(() => useAutoGroups([first, second], true));

    await waitFor(() => expect(MockWorker.instances).toHaveLength(1));
    const worker = MockWorker.instances[0]!;
    await waitFor(() =>
      expect(worker.posted).toEqual([
        {
          requestId: 1,
          pokemonIds: ["001", "004"],
          preferEvolutionLines: true,
        },
      ]),
    );
    expect(result.current.isRecomputing).toBe(true);

    act(() => worker.respond({ requestId: 1, groupIds: [["004", "001"]] }));

    await waitFor(() => expect(result.current.isRecomputing).toBe(false));
    expect(result.current.groups).toEqual([[second, first]]);
    expect(result.current.groups[0]?.[0]).toBe(second);
  });

  it("keeps previous groups visible and ignores superseded responses", async () => {
    const first = pokemon("001");
    const second = pokemon("004");
    const { result, rerender } = renderHook(
      ({ pool }) => useAutoGroups(pool, false),
      { initialProps: { pool: [first] } },
    );
    await waitFor(() => expect(MockWorker.instances[0]?.posted).toHaveLength(1));
    const worker = MockWorker.instances[0]!;
    act(() => worker.respond({ requestId: 1, groupIds: [["001"]] }));
    await waitFor(() => expect(result.current.isRecomputing).toBe(false));

    rerender({ pool: [first, second] });
    await waitFor(() => expect(worker.posted).toHaveLength(2));
    expect(result.current.isRecomputing).toBe(true);
    expect(result.current.groups).toEqual([[first]]);

    act(() => worker.respond({ requestId: 1, groupIds: [["004"]] }));
    expect(result.current.groups).toEqual([[first]]);
    expect(result.current.isRecomputing).toBe(true);

    act(() => worker.respond({ requestId: 2, groupIds: [["001", "004", "missing"]] }));
    await waitFor(() => expect(result.current.isRecomputing).toBe(false));
    expect(result.current.groups).toEqual([[first, second]]);
  });

  it("posts an empty pool and terminates its worker on unmount", async () => {
    const { unmount } = renderHook(() => useAutoGroups([], false));
    await waitFor(() => expect(MockWorker.instances[0]?.posted).toHaveLength(1));
    const worker = MockWorker.instances[0]!;

    expect(worker.posted[0]).toMatchObject({ pokemonIds: [] });
    unmount();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
