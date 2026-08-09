/** Compact, opaque transfer string for Pokédex + saved groups. */

export const TRANSFER_VERSION = 1;
const TRANSFER_PREFIX = `PKM${TRANSFER_VERSION}.`;

export interface TransferData {
  unlockedIds: string[];
  customGroups: string[][];
}

interface TransferPayloadV1 {
  v: 1;
  u: string[];
  g: string[][];
  c: string;
}

export type DecodeTransferResult =
  | { ok: true; data: TransferData }
  | { ok: false; error: string };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLength));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeJsonBase64Url(value: unknown): string {
  const json = JSON.stringify(value);
  return toBase64Url(new TextEncoder().encode(json));
}

function decodeJsonBase64Url(encoded: string): unknown {
  const json = new TextDecoder().decode(fromBase64Url(encoded));
  return JSON.parse(json) as unknown;
}

/** Short deterministic checksum so corrupted paste fails loudly. */
function checksum(unlockedIds: string[], customGroups: string[][]): string {
  const data = JSON.stringify({ u: unlockedIds, g: customGroups });
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStringMatrix(value: unknown): value is string[][] {
  return Array.isArray(value) && value.every(isStringArray);
}

/**
 * Sanitize imported IDs against the known Pokédex and group rules:
 * unknown IDs dropped, groups capped at 4, each Pokémon in at most one group.
 */
export function sanitizeTransferData(
  data: TransferData,
  knownIds: ReadonlySet<string>,
): TransferData {
  const unlockedIds = [
    ...new Set(data.unlockedIds.filter((id) => knownIds.has(id))),
  ];

  const seenInGroups = new Set<string>();
  const customGroups: string[][] = [];
  for (const group of data.customGroups) {
    const nextGroup: string[] = [];
    for (const id of group) {
      if (!knownIds.has(id) || seenInGroups.has(id)) continue;
      seenInGroups.add(id);
      nextGroup.push(id);
      if (nextGroup.length >= 4) break;
    }
    if (nextGroup.length > 0) customGroups.push(nextGroup);
  }

  return { unlockedIds, customGroups };
}

export function encodeTransferData(data: TransferData): string {
  const unlockedIds = [...data.unlockedIds];
  const customGroups = data.customGroups.map((group) => [...group]);
  const payload: TransferPayloadV1 = {
    v: TRANSFER_VERSION,
    u: unlockedIds,
    g: customGroups,
    c: checksum(unlockedIds, customGroups),
  };
  return `${TRANSFER_PREFIX}${encodeJsonBase64Url(payload)}`;
}

export function decodeTransferString(raw: string): DecodeTransferResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a transfer string first." };
  }

  const prefixMatch = /^PKM(\d+)\./.exec(trimmed);
  if (!prefixMatch) {
    return {
      ok: false,
      error: "That doesn’t look like a PokoMatch transfer string.",
    };
  }

  const version = Number(prefixMatch[1]);
  if (version !== TRANSFER_VERSION) {
    return {
      ok: false,
      error: `Unsupported transfer version (${version}). Update the app and try again.`,
    };
  }

  const encoded = trimmed.slice(prefixMatch[0].length);
  if (!encoded) {
    return { ok: false, error: "Transfer string is incomplete." };
  }

  let parsed: unknown;
  try {
    parsed = decodeJsonBase64Url(encoded);
  } catch {
    return { ok: false, error: "Could not decode that transfer string." };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("v" in parsed) ||
    !("u" in parsed) ||
    !("g" in parsed) ||
    !("c" in parsed)
  ) {
    return { ok: false, error: "Transfer string is missing required data." };
  }

  const payload = parsed as TransferPayloadV1;
  if (payload.v !== TRANSFER_VERSION) {
    return {
      ok: false,
      error: `Unsupported transfer version (${String(payload.v)}).`,
    };
  }
  if (!isStringArray(payload.u) || !isStringMatrix(payload.g)) {
    return { ok: false, error: "Transfer string has an invalid data shape." };
  }
  if (typeof payload.c !== "string" || payload.c.length === 0) {
    return { ok: false, error: "Transfer string checksum is missing." };
  }
  if (payload.c !== checksum(payload.u, payload.g)) {
    return {
      ok: false,
      error: "Transfer string is corrupted or was edited. Export again and retry.",
    };
  }

  return {
    ok: true,
    data: {
      unlockedIds: payload.u,
      customGroups: payload.g,
    },
  };
}
