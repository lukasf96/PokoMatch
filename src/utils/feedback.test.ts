// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FEEDBACK_LIMITS,
  getFeedbackRateLimitRemainingMs,
  getHCaptchaSiteKey,
  isFeedbackConfigured,
  submitFeedback,
  type FeedbackPayload,
} from "./feedback";

const NOW = new Date("2026-08-10T10:00:00Z").getTime();

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function validPayload(overrides: Partial<FeedbackPayload> = {}): FeedbackPayload {
  return {
    name: "Trainer",
    email: "trainer@example.com",
    message: "This is useful feedback.",
    website: "",
    captchaToken: "captcha-token",
    openedAt: NOW - 3_000,
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMemoryStorage());
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.stubEnv("VITE_WEB3FORMS_ACCESS_KEY", "test-access-key");
  vi.stubEnv("VITE_HCAPTCHA_SITEKEY", "test-site-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("feedback configuration and rate limiting", () => {
  it("reads configured keys and calculates remaining cooldown", () => {
    expect(getHCaptchaSiteKey()).toBe("test-site-key");
    expect(isFeedbackConfigured()).toBe(true);
    expect(getFeedbackRateLimitRemainingMs()).toBe(0);

    localStorage.setItem("pokomatch-feedback-last-submit", String(NOW - 60_000));
    expect(getFeedbackRateLimitRemainingMs()).toBe(4 * 60_000);
    expect(getFeedbackRateLimitRemainingMs(NOW + 10 * 60_000)).toBe(0);

    localStorage.setItem("pokomatch-feedback-last-submit", "not-a-number");
    expect(getFeedbackRateLimitRemainingMs()).toBe(0);
  });

  it("reports missing configuration", () => {
    vi.stubEnv("VITE_WEB3FORMS_ACCESS_KEY", "");
    expect(isFeedbackConfigured()).toBe(false);
  });
});

describe("submitFeedback validation", () => {
  it.each([
    ["honeypot", { website: "spam" }, /something went wrong/i],
    ["too quickly", { openedAt: NOW - 500 }, /take a moment/i],
    ["short message", { message: "short" }, /at least 10/i],
    [
      "long message",
      { message: "x".repeat(FEEDBACK_LIMITS.maxMessageLength + 1) },
      /at most 2000/i,
    ],
    [
      "long name",
      { name: "x".repeat(FEEDBACK_LIMITS.maxNameLength + 1) },
      /name must be at most/i,
    ],
    ["invalid email", { email: "not-an-email" }, /valid email/i],
    ["missing captcha", { captchaToken: "" }, /complete the captcha/i],
  ])("rejects %s", async (_caseName, overrides, expectedError) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitFeedback(validPayload(overrides))).resolves.toEqual({
      ok: false,
      error: expect.stringMatching(expectedError),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a submission during the cooldown", async () => {
    localStorage.setItem("pokomatch-feedback-last-submit", String(NOW - 1_000));
    await expect(submitFeedback(validPayload())).resolves.toEqual({
      ok: false,
      error: expect.stringMatching(/wait about 5 minutes/i),
    });
  });
});

describe("submitFeedback network behavior", () => {
  it("posts trimmed data and starts the cooldown after success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitFeedback(validPayload({ name: "  ", email: "", message: "  Helpful message  " })),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.web3forms.com/submit",
      expect.objectContaining({ method: "POST" }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      access_key: "test-access-key",
      subject: "PokoMatch feedback",
      from_name: "Anonymous",
      name: "Anonymous",
      message: "Helpful message",
      "h-captcha-response": "captcha-token",
      botcheck: false,
    });
    expect(getFeedbackRateLimitRemainingMs()).toBe(5 * 60_000);
  });

  it("uses API errors and handles network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ success: false, message: "Rejected" }),
      }),
    );
    await expect(submitFeedback(validPayload())).resolves.toEqual({
      ok: false,
      error: "Rejected",
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(submitFeedback(validPayload())).resolves.toEqual({
      ok: false,
      error: expect.stringMatching(/network error/i),
    });
  });
});
