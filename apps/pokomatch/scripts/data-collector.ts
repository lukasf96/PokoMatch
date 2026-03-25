import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SEREBII_BASE = "https://www.serebii.net";
const SEREBII_LIST_URL = `${SEREBII_BASE}/pokemonpokopia/availablepokemon.shtml`;
const SEREBII_EVENT_LIST_URL = `${SEREBII_BASE}/pokemonpokopia/eventpokedex.shtml`;
const SEREBII_ROBOTS_URL = `${SEREBII_BASE}/robots.txt`;

const POKEAPI_BASE = "https://pokeapi.co";

const DEFAULT_REQUEST_GAP_MS = 50;
const DEFAULT_POKEAPI_GAP_MS = 10;

const APP_ROOT = process.cwd();
const DEFAULT_OUT_PATH = path.join(APP_ROOT, "src", "assets", "pokedex.json");

/**
 * We identify as a data collector/enricher and honor robots.txt for Serebii.
 * (PokéAPI is a public API; still keep request rates modest.)
 */
const USER_AGENT = "Pokopia Data Collector/1.0";

interface ListRow {
  dexNumber: string;
  name: string;
  specialties: string[];
  detailPath: string;
}

interface DetailRow extends ListRow {
  idealHabitat: string;
  favoritesRaw: string[];
}

function normalizeSerebiiValue(raw: string): string {
  const v = raw.trim();
  const lower = v.toLowerCase();
  if (lower === "slender objects") return "Slender objects";
  if (lower === "noise stuff") return "Noisy stuff";
  return v;
}

interface LocalizedNames {
  de: string | null;
  fr: string | null;
}

export interface PokemonEntry {
  id: string;
  dexNumber: string;
  name: string;
  specialties: string[];
  idealHabitat: string;
  favorites: string[];
  favoriteFlavor: string | null;
  localizedNames?: LocalizedNames;
  evolutionLinePeerIds?: string[];
  isHabitable?: boolean;
}

export interface PokedexJson {
  generatedAt: string;
  standard: PokemonEntry[];
  event: PokemonEntry[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readNumberEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

function absolutizeSerebiiPath(href: string): string {
  if (href.startsWith("http")) return href;
  return `${SEREBII_BASE}${href.startsWith("/") ? "" : "/"}${href}`;
}

function normalizePokemonName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll(":", "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

const nameAliasMap = new Map<string, string>([
  ["professor tangrowth", "tangrowth"],
  ["peakychu", "pikachu"],
  ["mosslax", "snorlax"],
  ["paldean wooper", "wooper-paldea"],
  ["stereo rotom", "rotom"],
  ["mimikyu", "mimikyu-disguised"],
  ["shellos east sea", "shellos"],
  ["gastrodon east sea", "gastrodon"],
  ["tatsugiri curly form", "tatsugiri-curly"],
  ["tatsugiri droopy form", "tatsugiri-droopy"],
  ["tatsugiri stretchy form", "tatsugiri-stretchy"],
  ["toxtricity amped form", "toxtricity-amped"],
  ["toxtricity low key form", "toxtricity-low-key"],
]);

function toPokemonApiName(name: string): string {
  const normalized = normalizePokemonName(name);
  return (nameAliasMap.get(normalized) ?? normalized).replaceAll(" ", "-");
}

function parseOutPathFromArgs(argv: string[]): string | undefined {
  const idx = argv.findIndex((a) => a === "--out");
  if (idx < 0) return undefined;
  const p = argv[idx + 1];
  if (!p) return undefined;
  return path.isAbsolute(p) ? p : path.join(APP_ROOT, p);
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,text/plain;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${String(response.status)}`);
  return response.text();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

interface RobotsGroup {
  userAgents: string[];
  disallow: string[];
  allow: string[];
  crawlDelaySeconds?: number;
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
    else if (key === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) current.crawlDelaySeconds = n;
    }
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

function isPathAllowedByRobots(
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

async function assertSerebiiAccessAllowed(): Promise<{
  group: RobotsGroup | null;
  serebiiGapMs: number;
}> {
  const robotsTxt = await fetchText(SEREBII_ROBOTS_URL);
  const groups = parseRobotsTxt(robotsTxt);
  const group = pickRobotsGroup(groups, USER_AGENT);

  const mustCheck = [
    SEREBII_LIST_URL,
    SEREBII_EVENT_LIST_URL,
    SEREBII_ROBOTS_URL,
  ];
  for (const url of mustCheck) {
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
    readNumberEnv("SEREBII_GAP_MS") ?? DEFAULT_REQUEST_GAP_MS,
    crawlDelayMs,
  );

  return { group, serebiiGapMs };
}

function parseSerebiiList(html: string): ListRow[] {
  const $ = cheerio.load(html);
  const rows: ListRow[] = [];

  $("table.tab tr").each((_, tr) => {
    const tds = $(tr).children("td");
    if (tds.length < 4) return;

    const numText = $(tds[0]).text().trim();
    if (!/^#\d{3}$/.test(numText)) return;

    const nameCell = $(tds[2]);
    const nameLink = nameCell.find("a[href]").first();
    const name =
      nameLink.find("u").first().text().trim() || nameLink.text().trim();
    const href = nameLink.attr("href");
    if (!name || !href) return;
    if (href.includes("/specialty/")) return;

    const specialties: string[] = [];
    $(tds[3])
      .find('a[href*="/pokedex/specialty/"] u')
      .each((__, u) => {
        const s = $(u).text().trim();
        if (s) specialties.push(s);
      });

    rows.push({
      dexNumber: numText.replace("#", ""),
      name,
      specialties,
      detailPath: href,
    });
  });

  return rows;
}

function parseSerebiiDetail(html: string): {
  idealHabitat: string;
  favoritesRaw: string[];
} {
  const $ = cheerio.load(html);

  let idealHabitat = "";
  let favoritesRaw: string[] = [];
  let found = false;

  $("tr").each((_, tr) => {
    const trSel = $(tr);
    const cells = trSel.children("td.foo");
    if (cells.length !== 3) return;

    const labels = cells
      .map((__, td) => $(td).text().replace(/\s+/g, " ").trim())
      .get();

    if (
      labels[0] === "Specialty" &&
      labels[1] === "Ideal Habitat" &&
      labels[2] === "Favorites"
    ) {
      const dataRow = trSel.next("tr");
      const dataCells = dataRow.children("td");
      if (dataCells.length >= 3) {
        const idealLink = $(dataCells[1])
          .find('a[href*="idealhabitat"]')
          .first();
        idealHabitat =
          idealLink.find("u").first().text().trim() || idealLink.text().trim();

        favoritesRaw = [];
        // Serebii uses separate hrefs for "favorites" vs the final food/flavor line.
        // We must include both while preserving DOM order.
        $(dataCells[2])
          .find("a[href]")
          .each((__, a) => {
            const href = $(a).attr("href") ?? "";
            const isFavorite = href.includes("/pokemonpokopia/favorites/");
            const isFlavor = href.includes("/pokemonpokopia/flavors");
            if (!isFavorite && !isFlavor) return;

            const label =
              $(a).find("u").first().text().trim() || $(a).text().trim();
            if (!label) return;
            favoritesRaw.push(normalizeSerebiiValue(label));
          });
      }

      found = true;
      return false;
    }

    return undefined;
  });

  if (!found) return { idealHabitat: "", favoritesRaw: [] };
  return { idealHabitat, favoritesRaw };
}

/** Excel-style column letters: 0→a, 25→z, 26→aa, … */
function alphaSuffix(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

function splitFavoritesAndFlavor(
  name: string,
  favoritesRaw: string[],
): { favorites: string[]; favoriteFlavor: string | null } {
  if (name === "Ditto") return { favorites: [], favoriteFlavor: null };
  if (favoritesRaw.length === 0) return { favorites: [], favoriteFlavor: null };
  const favoriteFlavor = favoritesRaw[favoritesRaw.length - 1] ?? null;
  const favorites = favoritesRaw.slice(0, -1);
  return { favorites, favoriteFlavor };
}

function toPokemonEntries(
  details: DetailRow[],
  idPrefix: string,
): PokemonEntry[] {
  const countByDex = new Map<string, number>();
  for (const row of details)
    countByDex.set(row.dexNumber, (countByDex.get(row.dexNumber) ?? 0) + 1);

  const indexByDex = new Map<string, number>();
  const out: PokemonEntry[] = [];

  for (const row of details) {
    const total = countByDex.get(row.dexNumber) ?? 1;
    const idx = indexByDex.get(row.dexNumber) ?? 0;
    indexByDex.set(row.dexNumber, idx + 1);

    const idSuffix = total > 1 ? alphaSuffix(idx) : "";
    const id = `${idPrefix}${row.dexNumber}${idSuffix}`;
    const { favorites, favoriteFlavor } = splitFavoritesAndFlavor(
      row.name,
      row.favoritesRaw,
    );

    const isHabitable =
      id === "041a" || id === "297" || id === "298" ? false : undefined;

    out.push({
      id,
      dexNumber: row.dexNumber,
      name: row.name,
      specialties: row.specialties.map(normalizeSerebiiValue),
      idealHabitat: row.idealHabitat,
      favorites: favorites.map(normalizeSerebiiValue),
      favoriteFlavor: favoriteFlavor
        ? normalizeSerebiiValue(favoriteFlavor)
        : null,
      isHabitable,
    });
  }

  return out;
}

async function collectSerebiiDex(
  listUrl: string,
  label: string,
  robotsGroup: RobotsGroup | null,
  serebiiGapMs: number,
  idPrefix: string,
  limit: number | undefined,
): Promise<PokemonEntry[]> {
  console.error(`Reading ${label} list: ${listUrl}`);
  await sleep(serebiiGapMs);
  const listHtml = await fetchText(listUrl);
  const listRows = parseSerebiiList(listHtml);
  console.error(`Found ${String(listRows.length)} Pokémon (${label}).`);

  const toCollect = limit ? listRows.slice(0, limit) : listRows;
  const details: DetailRow[] = [];

  for (let i = 0; i < toCollect.length; i++) {
    const row = toCollect[i]!;
    const url = absolutizeSerebiiPath(row.detailPath);
    const urlObj = new URL(url);

    process.stderr.write(
      `\r[${label} ${String(i + 1)}/${String(toCollect.length)}] ${row.name}…`,
    );
    await sleep(serebiiGapMs);

    try {
      if (!isPathAllowedByRobots(robotsGroup, urlObj.pathname)) {
        console.error(
          `\nrobots.txt disallows collecting ${urlObj.pathname}; keeping empty habitat/favorites for ${row.name}.`,
        );
        details.push({ ...row, idealHabitat: "", favoritesRaw: [] });
        continue;
      }
      const html = await fetchText(url);
      const { idealHabitat, favoritesRaw } = parseSerebiiDetail(html);
      details.push({ ...row, idealHabitat, favoritesRaw });
    } catch (err) {
      console.error(`\nFailed ${urlObj.pathname}:`, err);
      details.push({ ...row, idealHabitat: "", favoritesRaw: [] });
    }
  }
  process.stderr.write("\n");

  return toPokemonEntries(details, idPrefix);
}

async function enrichWithLocalizations(
  entries: PokemonEntry[],
  pokeApiCtx: PokeApiContext,
): Promise<PokemonEntry[]> {
  const supportedLanguages: Array<keyof LocalizedNames> = ["de", "fr"];
  const localizedByApiName = new Map<string, LocalizedNames | null>();

  for (let i = 0; i < entries.length; i++) {
    const pokemon = entries[i]!;
    const apiName = toPokemonApiName(pokemon.name);
    if (localizedByApiName.has(apiName)) continue;

    process.stderr.write(
      `\r[localizations ${String(i + 1)}/${String(entries.length)}] ${pokemon.name}…`,
    );

    const speciesName =
      await pokeApiCtx.getSpeciesNameByPokemonApiName(apiName);
    if (!speciesName) {
      localizedByApiName.set(apiName, null);
      continue;
    }

    const speciesData =
      await pokeApiCtx.getPokemonSpeciesBySpeciesName(speciesName);
    if (!speciesData?.names) {
      localizedByApiName.set(apiName, null);
      continue;
    }

    const localized: LocalizedNames = { de: null, fr: null };
    for (const lang of supportedLanguages) {
      const entry = speciesData.names.find((n) => n.language?.name === lang);
      localized[lang] = entry?.name ?? null;
    }
    localizedByApiName.set(apiName, localized);
  }
  process.stderr.write("\n");

  return entries.map((pokemon) => {
    const apiName = toPokemonApiName(pokemon.name);
    const localized = localizedByApiName.get(apiName);
    const fallback: LocalizedNames = { de: pokemon.name, fr: pokemon.name };
    return {
      ...pokemon,
      localizedNames: localized ?? fallback,
    };
  });
}

interface PokeApiPokemonData {
  species?: { name?: string };
}

interface PokeApiPokemonSpeciesData {
  names?: Array<{ language?: { name?: string }; name?: string }>;
  evolution_chain?: { url?: string };
}

interface PokeApiEvolutionChainData {
  chain?: EvolutionNode;
}

interface EvolutionNode {
  species?: { name?: string };
  evolves_to?: EvolutionNode[];
}

interface PokeApiContext {
  getSpeciesNameByPokemonApiName(apiName: string): Promise<string | null>;
  getPokemonSpeciesBySpeciesName(
    speciesName: string,
  ): Promise<PokeApiPokemonSpeciesData | null>;
  getEvolutionChainSpeciesSet(chainUrl: string): Promise<Set<string> | null>;
}

function createPokeApiContext(pokeApiGapMs: number): PokeApiContext {
  const speciesNameByApiName = new Map<string, string | null>();
  const pokemonSpeciesBySpeciesName = new Map<
    string,
    PokeApiPokemonSpeciesData | null
  >();
  const chainSpeciesByUrl = new Map<string, Set<string> | null>();

  function collectSpeciesFromChain(
    node: EvolutionNode | undefined,
    out: Set<string>,
  ): void {
    const name = node?.species?.name;
    if (name) out.add(name);
    for (const next of node?.evolves_to ?? [])
      collectSpeciesFromChain(next, out);
  }

  async function getSpeciesNameByPokemonApiName(
    apiName: string,
  ): Promise<string | null> {
    if (speciesNameByApiName.has(apiName)) {
      return speciesNameByApiName.get(apiName) ?? null;
    }

    await sleep(pokeApiGapMs);
    const data = await fetchJson<PokeApiPokemonData>(
      `${POKEAPI_BASE}/api/v2/pokemon/${apiName}`,
    );
    const speciesName = data?.species?.name ?? null;
    speciesNameByApiName.set(apiName, speciesName);
    return speciesName;
  }

  async function getPokemonSpeciesBySpeciesName(
    speciesName: string,
  ): Promise<PokeApiPokemonSpeciesData | null> {
    if (pokemonSpeciesBySpeciesName.has(speciesName)) {
      return pokemonSpeciesBySpeciesName.get(speciesName) ?? null;
    }

    await sleep(pokeApiGapMs);
    const data = await fetchJson<PokeApiPokemonSpeciesData>(
      `${POKEAPI_BASE}/api/v2/pokemon-species/${speciesName}`,
    );
    pokemonSpeciesBySpeciesName.set(speciesName, data);
    return data;
  }

  async function getEvolutionChainSpeciesSet(
    chainUrl: string,
  ): Promise<Set<string> | null> {
    if (chainSpeciesByUrl.has(chainUrl)) {
      return chainSpeciesByUrl.get(chainUrl) ?? null;
    }

    await sleep(pokeApiGapMs);
    const data = await fetchJson<PokeApiEvolutionChainData>(chainUrl);
    if (!data?.chain) {
      chainSpeciesByUrl.set(chainUrl, null);
      return null;
    }

    const set = new Set<string>();
    collectSpeciesFromChain(data.chain, set);
    chainSpeciesByUrl.set(chainUrl, set);
    return set;
  }

  return {
    getSpeciesNameByPokemonApiName,
    getPokemonSpeciesBySpeciesName,
    getEvolutionChainSpeciesSet,
  };
}

async function enrichWithEvolutionPeers(
  entries: PokemonEntry[],
  pokeApiCtx: PokeApiContext,
): Promise<PokemonEntry[]> {
  const speciesNameByApiName = new Map<string, string | null>();

  const idBySpecies = new Map<string, string[]>();
  for (let i = 0; i < entries.length; i++) {
    const pokemon = entries[i]!;
    process.stderr.write(
      `\r[evolution species ${String(i + 1)}/${String(entries.length)}] ${pokemon.name}…`,
    );
    const apiName = toPokemonApiName(pokemon.name);
    const speciesName =
      await pokeApiCtx.getSpeciesNameByPokemonApiName(apiName);
    speciesNameByApiName.set(apiName, speciesName);
    if (!speciesName) continue;
    const list = idBySpecies.get(speciesName) ?? [];
    list.push(pokemon.id);
    idBySpecies.set(speciesName, list);
  }
  process.stderr.write("\n");

  const evolutionSetBySpecies = new Map<string, Set<string> | null>();
  const speciesKeys = [...idBySpecies.keys()];
  for (let i = 0; i < speciesKeys.length; i++) {
    const speciesName = speciesKeys[i]!;
    process.stderr.write(
      `\r[evolution chains ${String(i + 1)}/${String(speciesKeys.length)}] ${speciesName}…`,
    );
    const speciesData =
      await pokeApiCtx.getPokemonSpeciesBySpeciesName(speciesName);
    const chainUrl = speciesData?.evolution_chain?.url ?? null;
    if (!chainUrl) {
      evolutionSetBySpecies.set(speciesName, null);
      continue;
    }
    const set = await pokeApiCtx.getEvolutionChainSpeciesSet(chainUrl);
    evolutionSetBySpecies.set(speciesName, set);
  }
  process.stderr.write("\n");

  function peerIdsForPokemon(pokemon: PokemonEntry): string[] {
    const apiName = toPokemonApiName(pokemon.name);
    const speciesName = speciesNameByApiName.get(apiName) ?? null;
    if (!speciesName) return [];
    const evoSet = evolutionSetBySpecies.get(speciesName) ?? null;
    if (!evoSet) return [];

    const peers = new Set<string>();
    for (const s of evoSet) {
      const ids = idBySpecies.get(s);
      if (!ids) continue;
      for (const id of ids) if (id !== pokemon.id) peers.add(id);
    }
    return [...peers].sort();
  }

  return entries.map((pokemon) => ({
    ...pokemon,
    evolutionLinePeerIds: peerIdsForPokemon(pokemon),
  }));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  const outPath = parseOutPathFromArgs(argv) ?? DEFAULT_OUT_PATH;

  const pokeApiGapMs =
    readNumberEnv("POKEAPI_GAP_MS") ?? DEFAULT_POKEAPI_GAP_MS;

  const { group: robotsGroup, serebiiGapMs } =
    await assertSerebiiAccessAllowed();

  const pokeApiCtx = createPokeApiContext(pokeApiGapMs);

  const standard = await collectSerebiiDex(
    SEREBII_LIST_URL,
    "standard",
    robotsGroup,
    serebiiGapMs,
    "",
    undefined,
  );
  const event = await collectSerebiiDex(
    SEREBII_EVENT_LIST_URL,
    "event",
    robotsGroup,
    serebiiGapMs,
    "e",
    undefined,
  );

  let standardEnriched = standard;
  let eventEnriched = event;

  console.error("Enriching localized names via PokéAPI…");
  standardEnriched = await enrichWithLocalizations(
    standardEnriched,
    pokeApiCtx,
  );
  eventEnriched = await enrichWithLocalizations(eventEnriched, pokeApiCtx);

  console.error("Enriching evolution line peers via PokéAPI…");
  const standardCount = standardEnriched.length;
  const allEnrichedForEvoPeers = [...standardEnriched, ...eventEnriched];
  const allEnrichedWithEvoPeers = await enrichWithEvolutionPeers(
    allEnrichedForEvoPeers,
    pokeApiCtx,
  );
  standardEnriched = allEnrichedWithEvoPeers.slice(0, standardCount);
  eventEnriched = allEnrichedWithEvoPeers.slice(standardCount);

  const payload: PokedexJson = {
    generatedAt: new Date().toISOString(),
    standard: standardEnriched,
    event: eventEnriched,
  };

  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${outPath} (${String(payload.standard.length)} standard, ${String(payload.event.length)} event).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
