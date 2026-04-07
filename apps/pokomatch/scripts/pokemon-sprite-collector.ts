import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { writeTerminalProgressLine } from "./write-terminal-progress-line";

const APP_ROOT = process.cwd();
const tempDir = path.join(os.tmpdir(), "pokopia-pokeapi-sprites");
const spritesRepoDir = path.join(tempDir, "sprites");
/** Prefer HOME (modern renders), then official artwork, then legacy Gen-style sprites. */
const sourceSpriteVariantDirs = [
  path.join(spritesRepoDir, "sprites", "pokemon", "other", "home"),
  path.join(spritesRepoDir, "sprites", "pokemon", "other", "official-artwork"),
  path.join(spritesRepoDir, "sprites", "pokemon"),
];
const outputSpritesDir = path.join(APP_ROOT, "public", "sprites", "pokemon");
const pokedexPath = path.join(APP_ROOT, "src", "assets", "pokedex.json");

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

const NORMALIZED_SPRITE_SIZE = 128;
/** Strict upper bound: every output must be smaller than this (10 KiB). */
const MAX_WEBP_FILE_BYTES = 10 * 1024;
const SPRITE_OUTPUT_EXT = ".webp";

interface PokedexPokemonRef {
  id: string;
  name: string;
}

interface PokedexJson {
  standard: PokedexPokemonRef[];
  event: PokedexPokemonRef[];
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

function toPokemonApiName(name: string): string {
  const normalized = normalizePokemonName(name);
  return (nameAliasMap.get(normalized) ?? normalized).replaceAll(" ", "-");
}

async function ensureSpritesRepo(): Promise<void> {
  await mkdir(tempDir, { recursive: true });
  const hasRepo = await stat(path.join(spritesRepoDir, ".git"))
    .then(() => true)
    .catch(() => false);

  if (hasRepo) {
    console.error(
      `Using existing PokeAPI/sprites checkout at ${spritesRepoDir} (remove that folder to clone again).`,
    );
    return;
  }

  console.error(`Cloning PokeAPI/sprites (shallow) into ${spritesRepoDir}…`);
  const cloneResponse = await fetch(
    "https://github.com/PokeAPI/sprites.git/info/refs?service=git-upload-pack",
  );
  if (!cloneResponse.ok) {
    throw new Error("Cannot reach GitHub to clone sprites repository.");
  }

  await new Promise<void>((resolve, reject) => {
    const git = spawn(
      "git",
      ["clone", "--depth", "1", "https://github.com/PokeAPI/sprites.git", spritesRepoDir],
      { stdio: "inherit" },
    );
    git.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`git clone failed with code ${String(code)}`)),
    );
  });
  console.error("Sprites repository ready.");
}

/** PokeAPI `pokemon` resource id (matches sprite filenames in the sprites repo). */
async function fetchPokemonResourceId(pokemonApiName: string): Promise<number | null> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonApiName}`);
  if (!response.ok) return null;
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) return null;
  const id = (data as { id?: unknown }).id;
  return typeof id === "number" ? id : null;
}

async function resolveSourceSpritePath(pokemonResourceId: number): Promise<{
  fullPath: string;
  variantDir: string;
}> {
  const fileName = `${String(pokemonResourceId)}.png`;
  for (const dir of sourceSpriteVariantDirs) {
    const fullPath = path.join(dir, fileName);
    const exists = await stat(fullPath)
      .then(() => true)
      .catch(() => false);
    if (exists) return { fullPath, variantDir: dir };
  }
  throw new Error(
    `No sprite file ${fileName} in: ${sourceSpriteVariantDirs.join(", ")}`,
  );
}

function isLegacyPixelSpriteDir(variantDir: string): boolean {
  return variantDir === path.join(spritesRepoDir, "sprites", "pokemon");
}

async function writeWebpUnderByteBudget(params: {
  sourcePath: string;
  variantDir: string;
  targetPath: string;
}): Promise<void> {
  const { sourcePath, variantDir, targetPath } = params;
  const resizeKernel = isLegacyPixelSpriteDir(variantDir)
    ? sharp.kernel.nearest
    : sharp.kernel.lanczos3;

  const minDimension = 64;
  let dimension = NORMALIZED_SPRITE_SIZE;

  while (dimension >= minDimension) {
    const resizedPng = await sharp(sourcePath)
      .trim()
      .resize({
        width: dimension,
        height: dimension,
        fit: "contain",
        kernel: resizeKernel,
        withoutEnlargement: false,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    for (let quality = 82; quality >= 18; quality -= 4) {
      const webpBuf = await sharp(resizedPng)
        .webp({
          quality,
          alphaQuality: Math.min(quality + 12, 100),
          effort: 5,
        })
        .toBuffer();

      if (webpBuf.length < MAX_WEBP_FILE_BYTES) {
        await writeFile(targetPath, webpBuf);
        return;
      }
    }

    dimension -= 16;
  }

  throw new Error(
    `Could not encode ${path.basename(targetPath)} under ${String(MAX_WEBP_FILE_BYTES)} bytes.`,
  );
}

async function assertAllOutputsUnderBudget(): Promise<void> {
  const names = await readdir(outputSpritesDir);
  const webpNames = names.filter((n) => n.endsWith(SPRITE_OUTPUT_EXT));
  for (const name of webpNames) {
    const { size } = await stat(path.join(outputSpritesDir, name));
    if (size >= MAX_WEBP_FILE_BYTES) {
      throw new Error(
        `${name} is ${String(size)} bytes (max allowed ${String(MAX_WEBP_FILE_BYTES - 1)}).`,
      );
    }
  }
}

async function main(): Promise<void> {
  console.error(`Reading Pokédex: ${pokedexPath}`);
  await ensureSpritesRepo();
  const pokedexJson = JSON.parse(await readFile(pokedexPath, "utf8")) as PokedexJson;
  const allPokemon = [...pokedexJson.standard, ...pokedexJson.event];
  console.error(`Entries to process: ${String(allPokemon.length)}.`);

  const cachedResourceIdByApiName = new Map<string, number>();

  console.error("Resolving PokéAPI Pokémon ids…");
  for (let i = 0; i < allPokemon.length; i++) {
    const pokemon = allPokemon[i]!;
    writeTerminalProgressLine(
      process.stderr,
      `[pokeapi ${String(i + 1)}/${String(allPokemon.length)}] ${pokemon.name}…`,
    );
    const pokemonApiName = toPokemonApiName(pokemon.name);
    if (!cachedResourceIdByApiName.has(pokemonApiName)) {
      const resourceId = await fetchPokemonResourceId(pokemonApiName);
      if (resourceId === null) {
        throw new Error(`No PokéAPI id found for "${pokemon.name}" (${pokemonApiName}).`);
      }
      cachedResourceIdByApiName.set(pokemonApiName, resourceId);
    }
  }
  process.stderr.write("\n");

  console.error(`Encoding WebP to ${outputSpritesDir}…`);
  await rm(outputSpritesDir, { recursive: true, force: true });
  await mkdir(outputSpritesDir, { recursive: true });
  for (let i = 0; i < allPokemon.length; i++) {
    const pokemon = allPokemon[i]!;
    writeTerminalProgressLine(
      process.stderr,
      `[webp ${String(i + 1)}/${String(allPokemon.length)}] ${pokemon.name}…`,
    );
    const pokemonApiName = toPokemonApiName(pokemon.name);
    const pokemonResourceId = cachedResourceIdByApiName.get(pokemonApiName);
    if (pokemonResourceId === undefined) {
      throw new Error(`Missing cached id for ${pokemonApiName}`);
    }
    const { fullPath: sourcePath, variantDir } =
      await resolveSourceSpritePath(pokemonResourceId);
    const targetPath = path.join(
      outputSpritesDir,
      `${pokemon.id}${SPRITE_OUTPUT_EXT}`,
    );
    await writeWebpUnderByteBudget({ sourcePath, variantDir, targetPath });
  }
  process.stderr.write("\n");

  await assertAllOutputsUnderBudget();
  console.log(
    `Vendored ${String(allPokemon.length)} WebP sprite files (< ${String(MAX_WEBP_FILE_BYTES)} B each) to ${outputSpritesDir}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
