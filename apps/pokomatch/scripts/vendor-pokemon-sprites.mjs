import { mkdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const appRoot = process.cwd();
const tempDir = path.join(os.tmpdir(), "pokopia-pokeapi-sprites");
const spritesRepoDir = path.join(tempDir, "sprites");
const sourceSpritesDir = path.join(spritesRepoDir, "sprites", "pokemon");
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

const NORMALIZED_SPRITE_SIZE = 64;

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

async function fetchNationalId(pokemonApiName) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonApiName}`);
  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.id === "number" ? data.id : null;
}

async function run() {
  await ensureSpritesRepo();
  const pokedexJson = JSON.parse(await readFile(pokedexPath, "utf8"));
  const allPokemon = [...pokedexJson.standard, ...pokedexJson.event];

  const cachedNationalIdByApiName = new Map();

  for (const pokemon of allPokemon) {
    const pokemonApiName = toPokemonApiName(pokemon.name);
    if (!cachedNationalIdByApiName.has(pokemonApiName)) {
      const nationalId = await fetchNationalId(pokemonApiName);
      if (nationalId === null) {
        throw new Error(`No national dex id found for "${pokemon.name}" (${pokemonApiName}).`);
      }
      cachedNationalIdByApiName.set(pokemonApiName, nationalId);
    }

  }

  await rm(outputSpritesDir, { recursive: true, force: true });
  await mkdir(outputSpritesDir, { recursive: true });
  for (const pokemon of allPokemon) {
    const pokemonApiName = toPokemonApiName(pokemon.name);
    const nationalId = cachedNationalIdByApiName.get(pokemonApiName);
    const sourcePath = path.join(sourceSpritesDir, `${nationalId}.png`);
    const targetPath = path.join(outputSpritesDir, `${pokemon.id}.png`);

    await sharp(sourcePath)
      .trim()
      .resize({
        width: NORMALIZED_SPRITE_SIZE,
        height: NORMALIZED_SPRITE_SIZE,
        fit: "contain",
        kernel: sharp.kernel.nearest,
        withoutEnlargement: false,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(targetPath);
  }

  console.log(`Vendored ${String(allPokemon.length)} sprite files to ${outputSpritesDir}.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
