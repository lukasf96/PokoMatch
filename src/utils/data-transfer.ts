/** Compact, opaque transfer string for Pokédex + saved groups. */

import {
  POKOPIA_LOCATIONS,
  type CustomGroup,
  type PokopiaLocation,
} from "../types/types";

export const TRANSFER_VERSION = 1;
const TRANSFER_PREFIX = `PKM${TRANSFER_VERSION}.`;

export interface TransferData {
  unlockedIds: string[];
  /** Array order is the user's custom display order. */
  customGroups: CustomGroup[];
}

/** Compact group on the wire: id, pokemonIds, optional location. */
interface TransferGroupV1 {
  i: string;
  p: string[];
  l?: string;
}

interface TransferPayloadV1 {
  v: 1;
  u: string[];
  g: TransferGroupV1[];
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
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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
function checksum(unlockedIds: string[], groups: TransferGroupV1[]): string {
  const data = JSON.stringify({ u: unlockedIds, g: groups });
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isPokopiaLocation(value: unknown): value is PokopiaLocation {
  return (
    typeof value === "string" &&
    (POKOPIA_LOCATIONS as readonly string[]).includes(value)
  );
}

function isTransferGroup(value: unknown): value is TransferGroupV1 {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.i !== "string" || record.i.length === 0) return false;
  if (!isStringArray(record.p)) return false;
  if (
    "l" in record &&
    record.l !== undefined &&
    typeof record.l !== "string"
  ) {
    return false;
  }
  return true;
}

function isTransferGroupArray(value: unknown): value is TransferGroupV1[] {
  return Array.isArray(value) && value.every(isTransferGroup);
}

function newGroupId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toWireGroups(customGroups: CustomGroup[]): TransferGroupV1[] {
  return customGroups.map((group) => {
    const wire: TransferGroupV1 = {
      i: group.id,
      p: [...group.pokemonIds],
    };
    if (group.location) wire.l = group.location;
    return wire;
  });
}

function fromWireGroups(groups: TransferGroupV1[]): CustomGroup[] {
  return groups.map((group) => {
    const location = isPokopiaLocation(group.l) ? group.l : undefined;
    return {
      id: group.i,
      pokemonIds: [...group.p],
      ...(location ? { location } : {}),
    };
  });
}

/**
 * Sanitize imported IDs against the known Pokédex and group rules:
 * unknown IDs dropped, groups capped at 4, each Pokémon in at most one group.
 * Unknown locations are dropped. Array order (custom sort) is preserved.
 */
export function sanitizeTransferData(
  data: TransferData,
  knownIds: ReadonlySet<string>,
): TransferData {
  const unlockedIds = [
    ...new Set(data.unlockedIds.filter((id) => knownIds.has(id))),
  ];

  const seenInGroups = new Set<string>();
  const seenGroupIds = new Set<string>();
  const customGroups: CustomGroup[] = [];

  for (const group of data.customGroups) {
    const nextPokemonIds: string[] = [];
    for (const id of group.pokemonIds) {
      if (!knownIds.has(id) || seenInGroups.has(id)) continue;
      seenInGroups.add(id);
      nextPokemonIds.push(id);
      if (nextPokemonIds.length >= 4) break;
    }
    if (nextPokemonIds.length === 0) continue;

    const location: PokopiaLocation | undefined = isPokopiaLocation(
      group.location,
    )
      ? group.location
      : undefined;

    let id =
      typeof group.id === "string" && group.id.length > 0
        ? group.id
        : newGroupId();
    if (seenGroupIds.has(id)) id = newGroupId();
    seenGroupIds.add(id);

    customGroups.push({
      id,
      pokemonIds: nextPokemonIds,
      ...(location ? { location } : {}),
    });
  }

  return { unlockedIds, customGroups };
}

export function encodeTransferData(data: TransferData): string {
  const unlockedIds = [...data.unlockedIds];
  const groups = toWireGroups(data.customGroups);
  const payload: TransferPayloadV1 = {
    v: TRANSFER_VERSION,
    u: unlockedIds,
    g: groups,
    c: checksum(unlockedIds, groups),
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
      error: `Unsupported transfer version (${version}).`,
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
  if (!isStringArray(payload.u) || !isTransferGroupArray(payload.g)) {
    return { ok: false, error: "Transfer string has an invalid data shape." };
  }
  if (typeof payload.c !== "string" || payload.c.length === 0) {
    return { ok: false, error: "Transfer string checksum is missing." };
  }
  if (payload.c !== checksum(payload.u, payload.g)) {
    return {
      ok: false,
      error:
        "Transfer string is corrupted or was edited. Export again and retry.",
    };
  }

  return {
    ok: true,
    data: {
      unlockedIds: payload.u,
      customGroups: fromWireGroups(payload.g),
    },
  };
}
