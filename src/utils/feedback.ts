const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const RATE_LIMIT_STORAGE_KEY = "pokomatch-feedback-last-submit";
const RATE_LIMIT_MS = 5 * 60 * 1000;
const MIN_OPEN_MS = 2_000;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;

export type FeedbackPayload = {
  name: string;
  email: string;
  message: string;
  /** Honeypot — must stay empty. */
  website: string;
  captchaToken: string;
  openedAt: number;
};

export type FeedbackSubmitResult =
  | { ok: true }
  | { ok: false; error: string };

function readEnv(name: "VITE_WEB3FORMS_ACCESS_KEY" | "VITE_HCAPTCHA_SITEKEY") {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getAccessKey(): string | undefined {
  return readEnv("VITE_WEB3FORMS_ACCESS_KEY");
}

export function getHCaptchaSiteKey(): string | undefined {
  return readEnv("VITE_HCAPTCHA_SITEKEY");
}

export function isFeedbackConfigured(): boolean {
  return Boolean(getAccessKey() && getHCaptchaSiteKey());
}

export function getFeedbackRateLimitRemainingMs(now = Date.now()): number {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return 0;
    const last = Number(raw);
    if (!Number.isFinite(last)) return 0;
    return Math.max(0, last + RATE_LIMIT_MS - now);
  } catch {
    return 0;
  }
}

function markFeedbackSubmitted(now = Date.now()) {
  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(now));
  } catch {
    // ignore quota / private mode
  }
}

function validatePayload(payload: FeedbackPayload): string | null {
  if (payload.website.trim()) {
    return "Something went wrong. Please try again.";
  }

  if (Date.now() - payload.openedAt < MIN_OPEN_MS) {
    return "Please take a moment to write your message, then try again.";
  }

  const remaining = getFeedbackRateLimitRemainingMs();
  if (remaining > 0) {
    const minutes = Math.ceil(remaining / 60_000);
    return `Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} before sending again.`;
  }

  const message = payload.message.trim();
  if (message.length < MIN_MESSAGE_LENGTH) {
    return `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `Message must be at most ${MAX_MESSAGE_LENGTH} characters.`;
  }

  const name = payload.name.trim();
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  }

  const email = payload.email.trim();
  if (email.length > MAX_EMAIL_LENGTH) {
    return `Email must be at most ${MAX_EMAIL_LENGTH} characters.`;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  if (!payload.captchaToken) {
    return "Please complete the captcha.";
  }

  return null;
}

export async function submitFeedback(
  payload: FeedbackPayload,
): Promise<FeedbackSubmitResult> {
  const validationError = validatePayload(payload);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const accessKey = getAccessKey();
  if (!accessKey) {
    return {
      ok: false,
      error: "Feedback is not configured in this build.",
    };
  }

  const name = payload.name.trim() || "Anonymous";
  const email = payload.email.trim();
  const body: Record<string, string | boolean> = {
    access_key: accessKey,
    subject: "PokoMatch feedback",
    from_name: name,
    name,
    message: payload.message.trim(),
    "h-captcha-response": payload.captchaToken,
    botcheck: false,
  };
  if (email) {
    body.email = email;
  }

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;

    if (!response.ok || !data?.success) {
      return {
        ok: false,
        error:
          data?.message?.trim() ||
          "Could not send feedback. Please try again later.",
      };
    }

    markFeedbackSubmitted();
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error — check your connection and try again.",
    };
  }
}

export const FEEDBACK_LIMITS = {
  minMessageLength: MIN_MESSAGE_LENGTH,
  maxMessageLength: MAX_MESSAGE_LENGTH,
  maxNameLength: MAX_NAME_LENGTH,
  maxEmailLength: MAX_EMAIL_LENGTH,
} as const;
