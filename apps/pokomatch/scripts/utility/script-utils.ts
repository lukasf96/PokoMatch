import path from "node:path";
import process from "node:process";
import type { WriteStream } from "node:tty";

export const APP_ROOT = process.cwd();

export const SEREBII_BASE = "https://www.serebii.net";
export const SEREBII_ROBOTS_URL = `${SEREBII_BASE}/robots.txt`;

/** First-party Pokopia pages we fetch on Serebii (for robots.txt checks / URLs). */
export const SEREBII_URLS = {
  availablePokemon: `${SEREBII_BASE}/pokemonpokopia/availablepokemon.shtml`,
  eventPokedex: `${SEREBII_BASE}/pokemonpokopia/eventpokedex.shtml`,
  itemsOverview: `${SEREBII_BASE}/pokemonpokopia/items.shtml`,
} as const;

/**
 * We identify as a data collector and honor robots.txt for Serebii.
 */
export const USER_AGENT = "Pokopia Data Collector/1.0";

export const DEFAULT_SEREBII_REQUEST_GAP_MS = 10;
export const DEFAULT_POKEAPI_GAP_MS = 10;

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
];

const pokemonNameAliasMap = new Map<string, string>(POKEMON_NAME_ALIAS_ENTRIES);

export function normalizePokemonName(name: string): string {
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

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,text/plain;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${String(response.status)}`);
  return response.text();
}

export async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export interface PokeApiPokemonResolve {
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
  options?: { gapMsBetweenSequentialPokeApiCalls?: number },
): Promise<PokeApiPokemonResolve | null> {
  const seqGap = options?.gapMsBetweenSequentialPokeApiCalls ?? 0;

  const pokemonUrl = `${POKEAPI_BASE}/api/v2/pokemon/${pokemonApiName}`;
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
    sprites?: { front_default?: string | null };
  }
  if (seqGap > 0) await sleep(seqGap);
  const formUrl = `${POKEAPI_BASE}/api/v2/pokemon-form/${pokemonApiName}`;
  const formJson = await fetchJson<PokeApiPokemonFormJson>(formUrl);
  const linkedPokemonUrl = formJson?.pokemon?.url;
  if (!linkedPokemonUrl) return null;

  if (seqGap > 0) await sleep(seqGap);
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
  }

  return {
    id,
    spriteRepoStem,
    pokemonJsonUrl: linkedPokemonUrl,
    speciesName: linkedPokemon.species?.name ?? null,
  };
}

/** PokeAPI `pokemon` resource id (national dex number of the resolved species entry). */
export async function fetchPokemonResourceIdByApiName(
  pokemonApiName: string,
): Promise<number | null> {
  const resolved = await resolvePokeApiPokemonByApiName(pokemonApiName);
  return resolved?.id ?? null;
}

/**
 * Sprite filename stem under PokeAPI/sprites (e.g. `422-east` for `shellos-east`;
 * plain `422` when the api name is the default `pokemon` slug).
 */
export async function fetchPokemonSpriteRepoStemByApiName(
  pokemonApiName: string,
): Promise<string | null> {
  const resolved = await resolvePokeApiPokemonByApiName(pokemonApiName);
  return resolved?.spriteRepoStem ?? null;
}


export interface RobotsGroup {
  userAgents: string[];
  disallow: string[];
  allow: string[];
  crawlDelaySeconds?: number;
}

export function parseRobotsTxt(content: string): RobotsGroup[] {
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
    else if (key === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) current.crawlDelaySeconds = n;
    }
  }

  return groups.filter((g) => g.userAgents.length > 0);
}

export function pickRobotsGroup(
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

export async function assertSerebiiRobotsAndGap(options: {
  mustCheckUrls: readonly string[];
  defaultRequestGapMs?: number;
}): Promise<{ group: RobotsGroup | null; serebiiGapMs: number }> {
  const defaultRequestGapMs =
    options.defaultRequestGapMs ?? DEFAULT_SEREBII_REQUEST_GAP_MS;

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

  const crawlDelayMs =
    group?.crawlDelaySeconds !== undefined
      ? Math.ceil(group.crawlDelaySeconds * 1000)
      : 0;
  const serebiiGapMs = Math.max(
    readNumberEnv("SEREBII_GAP_MS") ?? defaultRequestGapMs,
    crawlDelayMs,
  );

  return { group, serebiiGapMs };
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
