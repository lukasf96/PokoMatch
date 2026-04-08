import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  APP_ROOT,
  DEFAULT_POKEAPI_GAP_MS,
  POKEAPI_BASE,
  SEREBII_ROBOTS_URL,
  SEREBII_URLS,
  absolutizeSerebiiHrefFromSite,
  assertSerebiiRobotsAndGap,
  fetchJson,
  fetchText,
  isPathAllowedByRobots,
  parseOutPathCli,
  readNumberEnv,
  resolvePokeApiPokemonByApiName,
  sleep,
  toPokemonApiName,
  writeTerminalProgressLine,
  type RobotsGroup,
} from "./utility/script-utils";

const DEFAULT_OUT_PATH = path.join(APP_ROOT, "src", "assets", "pokedex.json");

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

// Correct inconsistent data -> DELETE if this is no longer needed
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
): Promise<PokemonEntry[]> {
  console.error(`Reading ${label} list: ${listUrl}`);
  await sleep(serebiiGapMs);
  const listHtml = await fetchText(listUrl);
  const listRows = parseSerebiiList(listHtml);
  console.error(`Found ${String(listRows.length)} Pokémon (${label}).`);

  const details: DetailRow[] = [];

  for (let i = 0; i < listRows.length; i++) {
    const row = listRows[i]!;
    const url = absolutizeSerebiiHrefFromSite(row.detailPath);
    const urlObj = new URL(url);

    writeTerminalProgressLine(
      process.stderr,
      `[${label} ${String(i + 1)}/${String(listRows.length)}] ${row.name}…`,
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

    writeTerminalProgressLine(
      process.stderr,
      `[localizations ${String(i + 1)}/${String(entries.length)}] ${pokemon.name}…`,
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
    const resolved = await resolvePokeApiPokemonByApiName(apiName, {
      gapMsBetweenSequentialPokeApiCalls: pokeApiGapMs,
    });
    const speciesName = resolved?.speciesName ?? null;
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
    writeTerminalProgressLine(
      process.stderr,
      `[evolution species ${String(i + 1)}/${String(entries.length)}] ${pokemon.name}…`,
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
    writeTerminalProgressLine(
      process.stderr,
      `[evolution chains ${String(i + 1)}/${String(speciesKeys.length)}] ${speciesName}…`,
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

  const outPath = parseOutPathCli(argv) ?? DEFAULT_OUT_PATH;

  const pokeApiGapMs =
    readNumberEnv("POKEAPI_GAP_MS") ?? DEFAULT_POKEAPI_GAP_MS;

  const { group: robotsGroup, serebiiGapMs } = await assertSerebiiRobotsAndGap({
    mustCheckUrls: [
      SEREBII_URLS.availablePokemon,
      SEREBII_URLS.eventPokedex,
      SEREBII_ROBOTS_URL,
    ],
  });

  const pokeApiCtx = createPokeApiContext(pokeApiGapMs);

  const standard = await collectSerebiiDex(
    SEREBII_URLS.availablePokemon,
    "standard",
    robotsGroup,
    serebiiGapMs,
    "",
  );
  const event = await collectSerebiiDex(
    SEREBII_URLS.eventPokedex,
    "event",
    robotsGroup,
    serebiiGapMs,
    "e",
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
