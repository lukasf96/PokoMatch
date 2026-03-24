import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const appRoot = process.cwd();
const tempDir = path.join(os.tmpdir(), "pokopia-pokeapi-sprites");
const spritesRepoDir = path.join(tempDir, "sprites");
/** Prefer HOME (modern renders), then official artwork, then legacy Gen-style sprites. */
const sourceSpriteVariantDirs = [
  path.join(spritesRepoDir, "sprites", "pokemon", "other", "home"),
  path.join(spritesRepoDir, "sprites", "pokemon", "other", "official-artwork"),
  path.join(spritesRepoDir, "sprites", "pokemon"),
];
const outputSpritesDir = path.join(appRoot, "public", "sprites", "pokemon");
const pokedexPath = path.join(appRoot, "src", "assets", "pokedex.json");

const nameAliasMap = new Map([
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

function normalizePokemonName(name) {
  return name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll(":", "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function toPokemonApiName(name) {
  const normalized = normalizePokemonName(name);
  return (nameAliasMap.get(normalized) ?? normalized).replaceAll(" ", "-");
}

async function ensureSpritesRepo() {
  await mkdir(tempDir, { recursive: true });
  const hasRepo = await stat(path.join(spritesRepoDir, ".git"))
    .then(() => true)
    .catch(() => false);

  if (hasRepo) return;

  const cloneResponse = await fetch("https://github.com/PokeAPI/sprites.git/info/refs?service=git-upload-pack");
  if (!cloneResponse.ok) {
    throw new Error("Cannot reach GitHub to clone sprites repository.");
  }

  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
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
}

/** PokeAPI `pokemon` resource id (matches sprite filenames in the sprites repo). */
async function fetchPokemonResourceId(pokemonApiName) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonApiName}`);
  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.id === "number" ? data.id : null;
}

async function resolveSourceSpritePath(pokemonResourceId) {
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

function isLegacyPixelSpriteDir(variantDir) {
  return variantDir === path.join(spritesRepoDir, "sprites", "pokemon");
}

async function writeWebpUnderByteBudget({
  sourcePath,
  variantDir,
  targetPath,
}) {
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

async function assertAllOutputsUnderBudget() {
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

async function run() {
  await ensureSpritesRepo();
  const pokedexJson = JSON.parse(await readFile(pokedexPath, "utf8"));
  const allPokemon = [...pokedexJson.standard, ...pokedexJson.event];

  const cachedResourceIdByApiName = new Map();

  for (const pokemon of allPokemon) {
    const pokemonApiName = toPokemonApiName(pokemon.name);
    if (!cachedResourceIdByApiName.has(pokemonApiName)) {
      const resourceId = await fetchPokemonResourceId(pokemonApiName);
      if (resourceId === null) {
        throw new Error(`No PokéAPI id found for "${pokemon.name}" (${pokemonApiName}).`);
      }
      cachedResourceIdByApiName.set(pokemonApiName, resourceId);
    }

  }

  await rm(outputSpritesDir, { recursive: true, force: true });
  await mkdir(outputSpritesDir, { recursive: true });
  for (const pokemon of allPokemon) {
    const pokemonApiName = toPokemonApiName(pokemon.name);
    const pokemonResourceId = cachedResourceIdByApiName.get(pokemonApiName);
    const { fullPath: sourcePath, variantDir } = await resolveSourceSpritePath(pokemonResourceId);
    const targetPath = path.join(
      outputSpritesDir,
      `${pokemon.id}${SPRITE_OUTPUT_EXT}`,
    );
    await writeWebpUnderByteBudget({ sourcePath, variantDir, targetPath });
  }

  await assertAllOutputsUnderBudget();
  console.log(
    `Vendored ${String(allPokemon.length)} WebP sprite files (< ${String(MAX_WEBP_FILE_BYTES)} B each) to ${outputSpritesDir}.`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
