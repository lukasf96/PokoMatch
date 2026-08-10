import path from "node:path";
import process from "node:process";
import type { WriteStream } from "node:tty";

export const APP_ROOT = process.cwd();

const SEREBII_BASE = "https://www.serebii.net";
export const SEREBII_ROBOTS_URL = `${SEREBII_BASE}/robots.txt`;

/** First-party Pokopia pages we fetch on Serebii (for robots.txt checks / URLs). */
export const SEREBII_URLS = {
  availablePokemon: `${SEREBII_BASE}/pokemonpokopia/availablepokemon.shtml`,
  eventPokedex: `${SEREBII_BASE}/pokemonpokopia/eventpokedex.shtml`,
  basinPokedex: `${SEREBII_BASE}/pokemonpokopia/basinpokedex.shtml`,
  itemsOverview: `${SEREBII_BASE}/pokemonpokopia/items.shtml`,
  favoritesOverview: `${SEREBII_BASE}/pokemonpokopia/favorites.shtml`,
} as const;

/**
 * We identify as a data collector and honor robots.txt for Serebii.
 */
const USER_AGENT = "Pokopia Data Collector/1.0";

export const DEFAULT_SEREBII_CONCURRENCY = 3;
export const DEFAULT_POKEAPI_GAP_MS = 10;
export const DEFAULT_POKEAPI_CONCURRENCY = 12;

export const POKEAPI_BASE = "https://pokeapi.co";

const POKEMON_NAME_ALIAS_ENTRIES: readonly (readonly [string, string])[] = [
  ["professor tangrowth", "tangrowth"],
  ["peakychu", "pikachu"],
  ["mosslax", "snorlax"],
  ["paldean wooper", "wooper-paldea"],
  ["stereo rotom", "rotom"],
  ["mimikyu", "mimikyu-disguised"],
  ["shellos east sea", "shellos-east"],
  ["gastrodon east sea", "gastrodon-east"],
  ["tatsugiri curly form", "tatsugiri-curly"],
  ["tatsugiri droopy form", "tatsugiri-droopy"],
  ["tatsugiri stretchy form", "tatsugiri-stretchy"],
  ["toxtricity amped form", "toxtricity-amped"],
  ["toxtricity low key form", "toxtricity-low-key"],
  // Gen 5 gender diffs: species default is `*-male`; female is a pokemon-form
  // slug whose sprites live under `female/{id}` in PokeAPI/sprites (not a
  // separate pokemon resource).
  ["frillish male form", "frillish-male"],
  ["frillish female form", "frillish-female"],
  ["jellicent male form", "jellicent-male"],
  ["jellicent female form", "jellicent-female"],
];

const pokemonNameAliasMap = new Map<string, string>(POKEMON_NAME_ALIAS_ENTRIES);

function normalizePokemonName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll(":", "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function toPokemonApiName(name: string): string {
  const normalized = normalizePokemonName(name);
  return (pokemonNameAliasMap.get(normalized) ?? normalized).replaceAll(" ", "-");
}

export function resolveAppAssetPath(...parts: string[]): string {
  return path.join(APP_ROOT, "src", "assets", ...parts);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function readNumberEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

export function readPositiveIntegerEnv(
  name: string,
  fallback: number,
): number {
  const value = readNumberEnv(name);
  return value === undefined || value < 1 ? fallback : value;
}

/** Maps concurrently while preserving input order and bounding active work. */
export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (values.length === 0) return [];
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index]!, index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), values.length) },
      worker,
    ),
  );
  return results;
}

/**
 * Returns a gate that spaces request starts across all concurrent workers.
 * This avoids turning a worker pool into a burst of simultaneous requests.
 */
export function createRequestStartGate(gapMs: number): () => Promise<void> {
  let nextStartAt = 0;
  let tail = Promise.resolve();

  return async (): Promise<void> => {
    let release!: () => void;
    const previous = tail;
    tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    const waitMs = Math.max(0, nextStartAt - Date.now());
    if (waitMs > 0) await sleep(waitMs);
    nextStartAt = Date.now() + gapMs;
    release();
  };
}

export function parseOutPathCli(
  argv: string[],
  cwd: string = APP_ROOT,
): string | undefined {
  const idx = argv.findIndex((a) => a === "--out");
  if (idx < 0) return undefined;
  const p = argv[idx + 1];
  if (!p) return undefined;
  return path.isAbsolute(p) ? p : path.join(cwd, p);
}

export async function fetchWithRetry(
  url: string,
  options: { retries?: number; init?: RequestInit } = {},
): Promise<Response> {
  const retries = options.retries ?? 2;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options.init);
      if (
        response.ok ||
        response.status === 404 ||
        (response.status !== 408 && response.status !== 429 && response.status < 500) ||
        attempt === retries
      ) {
        return response;
      }
      lastError = new Error(`GET ${url} -> ${String(response.status)}`);
      const retryAfterSeconds = Number(response.headers.get("retry-after"));
      await response.body?.cancel();
      await sleep(
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
          ? retryAfterSeconds * 1000
          : 500 * 2 ** attempt,
      );
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetchWithRetry(url, {
    init: {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.8",
      },
    },
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${String(response.status)}`);
  return response.text();
}

export async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetchWithRetry(url, {
    init: {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

interface PokeApiPokemonResolve {
  /** National dex style id from the linked `pokemon` resource. */
  id: number;
  /**
   * Base filename stem in PokeAPI/sprites (e.g. `422` or `422-east` for regional forms
   * that only exist as `pokemon-form` slugs).
   */
  spriteRepoStem: string;
  /** Absolute URL to the `pokemon` JSON (species chain, etc.). */
  pokemonJsonUrl: string;
  speciesName: string | null;
}

/**
 * Resolves a name from {@link toPokemonApiName} to the underlying `pokemon` resource.
 * Form-only slugs (e.g. `shellos-east`) are accepted via `/pokemon-form/{name}`.
 */
export async function resolvePokeApiPokemonByApiName(
  pokemonApiName: string,
  options?: {
    gapMsBetweenSequentialPokeApiCalls?: number;
    beforeRequest?: () => Promise<void>;
  },
): Promise<PokeApiPokemonResolve | null> {
  const seqGap = options?.gapMsBetweenSequentialPokeApiCalls ?? 0;
  const beforeRequest = options?.beforeRequest;

  const pokemonUrl = `${POKEAPI_BASE}/api/v2/pokemon/${pokemonApiName}`;
  if (beforeRequest) await beforeRequest();
  const pokemonJson = await fetchJson<{
    id?: unknown;
    species?: { name?: string };
  }>(pokemonUrl);
  if (pokemonJson && typeof pokemonJson.id === "number") {
    const id = pokemonJson.id;
    return {
      id,
      spriteRepoStem: String(id),
      pokemonJsonUrl: pokemonUrl,
      speciesName: pokemonJson.species?.name ?? null,
    };
  }

  interface PokeApiPokemonFormJson {
    pokemon?: { url?: string };
    form_name?: string;
    sprites?: { front_default?: string | null };
  }
  if (beforeRequest) await beforeRequest();
  else if (seqGap > 0) await sleep(seqGap);
  const formUrl = `${POKEAPI_BASE}/api/v2/pokemon-form/${pokemonApiName}`;
  const formJson = await fetchJson<PokeApiPokemonFormJson>(formUrl);
  const linkedPokemonUrl = formJson?.pokemon?.url;
  if (!linkedPokemonUrl) return null;

  if (beforeRequest) await beforeRequest();
  else if (seqGap > 0) await sleep(seqGap);
  const linkedPokemon = await fetchJson<{
    id?: unknown;
    species?: { name?: string };
  }>(linkedPokemonUrl);
  if (!linkedPokemon || typeof linkedPokemon.id !== "number") return null;

  const id = linkedPokemon.id;
  let spriteRepoStem = String(id);
  const front = formJson.sprites?.front_default;
  if (typeof front === "string") {
    const stemMatch = /\/(\d+(?:-[\w-]+)?)\.png(?:\?|$)/i.exec(front);
    if (stemMatch) spriteRepoStem = stemMatch[1]!;
  } else if (
    formJson.form_name === "female" ||
    pokemonApiName.endsWith("-female")
  ) {
    // Gender-difference forms (Frillish/Jellicent) share the male pokemon id;
    // artwork is under female/ in each sprite variant folder.
    spriteRepoStem = `female/${String(id)}`;
  }

  return {
    id,
    spriteRepoStem,
    pokemonJsonUrl: linkedPokemonUrl,
    speciesName: linkedPokemon.species?.name ?? null,
  };
}

/**
 * Sprite filename stem under PokeAPI/sprites (e.g. `422-east` for `shellos-east`;
 * plain `422` when the api name is the default `pokemon` slug).
 */
export async function fetchPokemonSpriteRepoStemByApiName(
  pokemonApiName: string,
  options?: { beforeRequest?: () => Promise<void> },
): Promise<string | null> {
  const resolved = await resolvePokeApiPokemonByApiName(
    pokemonApiName,
    options,
  );
  return resolved?.spriteRepoStem ?? null;
}


export interface RobotsGroup {
  userAgents: string[];
  disallow: string[];
  allow: string[];
}

function parseRobotsTxt(content: string): RobotsGroup[] {
  const lines = content
    .split(/\r?\n/g)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);

  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;

  for (const line of lines) {
    const match = /^([a-zA-Z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1]!.toLowerCase();
    const value = match[2]!.trim();

    if (key === "user-agent") {
      if (
        !current ||
        (current.userAgents.length > 0 &&
          current.disallow.length + current.allow.length > 0)
      ) {
        current = { userAgents: [], disallow: [], allow: [] };
        groups.push(current);
      }
      current.userAgents.push(value);
      continue;
    }

    if (!current) continue;

    if (key === "disallow") current.disallow.push(value);
    else if (key === "allow") current.allow.push(value);
  }

  return groups.filter((g) => g.userAgents.length > 0);
}

function pickRobotsGroup(
  groups: RobotsGroup[],
  userAgent: string,
): RobotsGroup | null {
  const ua = userAgent.toLowerCase();
  const exact = groups.find((g) =>
    g.userAgents.some((x) => x.toLowerCase() === ua),
  );
  if (exact) return exact;
  const star = groups.find((g) => g.userAgents.some((x) => x === "*"));
  return star ?? null;
}

export function isPathAllowedByRobots(
  group: RobotsGroup | null,
  urlPath: string,
): boolean {
  if (!group) return true;

  const allowRules = group.allow
    .filter((p) => p !== "")
    .sort((a, b) => b.length - a.length);
  const disallowRules = group.disallow
    .filter((p) => p !== "")
    .sort((a, b) => b.length - a.length);

  const bestAllow = allowRules.find((p) => urlPath.startsWith(p));
  const bestDisallow = disallowRules.find((p) => urlPath.startsWith(p));

  if (bestAllow && bestDisallow) return bestAllow.length >= bestDisallow.length;
  if (bestDisallow) return false;
  return true;
}

export async function assertSerebiiRobots(options: {
  mustCheckUrls: readonly string[];
}): Promise<{ group: RobotsGroup | null }> {
  const robotsTxt = await fetchText(SEREBII_ROBOTS_URL);
  const groups = parseRobotsTxt(robotsTxt);
  const group = pickRobotsGroup(groups, USER_AGENT);

  for (const url of options.mustCheckUrls) {
    const u = new URL(url);
    if (!isPathAllowedByRobots(group, u.pathname)) {
      throw new Error(
        `robots.txt disallows collecting ${u.pathname} for our User-Agent. Aborting.`,
      );
    }
  }

  return { group };
}

/** Serebii href relative to site root (e.g. dex list/detail links). */
export function absolutizeSerebiiHrefFromSite(href: string): string {
  if (href.startsWith("http")) return href;
  return `${SEREBII_BASE}${href.startsWith("/") ? "" : "/"}${href}`;
}

/** Serebii href relative to a concrete page URL (e.g. items overview). */
export function absolutizeSerebiiHrefFromPage(href: string, pageUrl: string): string {
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return `${SEREBII_BASE}${href}`;
  const baseDir = pageUrl.replace(/\/[^/]*$/, "/");
  return `${baseDir}${href}`;
}

/** ANSI EL0: erase from cursor through end of line (needed after `\r` overwrites). */
const CLEAR_TO_EOL = "\x1b[K";

export function writeTerminalProgressLine(stream: WriteStream, text: string): void {
  stream.write(`\r${text}${CLEAR_TO_EOL}`);
}
