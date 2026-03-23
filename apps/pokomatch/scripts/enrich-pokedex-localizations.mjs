import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const appRoot = process.cwd();
const pokedexPath = path.join(appRoot, "src", "assets", "pokedex.json");
const supportedLanguages = ["de", "fr"];

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

async function fetchPokemonSpeciesName(pokemonApiName) {
  const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonApiName}`);
  if (!pokemonResponse.ok) return null;
  const pokemonData = await pokemonResponse.json();
  return pokemonData?.species?.name ?? null;
}

async function fetchSpeciesLocalizationByName(speciesName) {
  const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesName}`);
  if (!speciesResponse.ok) return null;
  const speciesData = await speciesResponse.json();

  const localizedNames = {};
  for (const language of supportedLanguages) {
    const entry = speciesData.names.find(
      (nameItem) => nameItem.language?.name === language,
    );
    localizedNames[language] = entry?.name ?? null;
  }
  return localizedNames;
}

function withLocalization(pokemon, localizedNames) {
  return {
    ...pokemon,
    localizedNames,
  };
}

async function run() {
  const pokedexJson = JSON.parse(await readFile(pokedexPath, "utf8"));
  const allPokemon = [...pokedexJson.standard, ...pokedexJson.event];

  const localizedNamesByApiName = new Map();
  const unresolved = [];

  for (const pokemon of allPokemon) {
    const pokemonApiName = toPokemonApiName(pokemon.name);
    if (localizedNamesByApiName.has(pokemonApiName)) continue;

    const speciesName = await fetchPokemonSpeciesName(pokemonApiName);
    if (speciesName === null) {
      unresolved.push({ id: pokemon.id, name: pokemon.name, pokemonApiName });
      localizedNamesByApiName.set(pokemonApiName, null);
      continue;
    }

    const localizedNames = await fetchSpeciesLocalizationByName(speciesName);
    if (localizedNames === null) {
      unresolved.push({ id: pokemon.id, name: pokemon.name, pokemonApiName });
      localizedNamesByApiName.set(pokemonApiName, null);
      continue;
    }

    localizedNamesByApiName.set(pokemonApiName, localizedNames);
  }

  const standard = pokedexJson.standard.map((pokemon) => {
    const pokemonApiName = toPokemonApiName(pokemon.name);
    const localizedNames = localizedNamesByApiName.get(pokemonApiName);
    const fallback = {
      de: pokemon.name,
      fr: pokemon.name,
    };
    return withLocalization(pokemon, localizedNames ?? fallback);
  });

  const event = pokedexJson.event.map((pokemon) => {
    const pokemonApiName = toPokemonApiName(pokemon.name);
    const localizedNames = localizedNamesByApiName.get(pokemonApiName);
    const fallback = {
      de: pokemon.name,
      fr: pokemon.name,
    };
    return withLocalization(pokemon, localizedNames ?? fallback);
  });

  const enrichedPokedex = {
    ...pokedexJson,
    standard,
    event,
  };

  await writeFile(pokedexPath, `${JSON.stringify(enrichedPokedex, null, 2)}\n`);

  if (unresolved.length > 0) {
    console.warn(
      `Localized with fallbacks for ${String(unresolved.length)} entries:`,
      unresolved.map((entry) => `${entry.id} (${entry.name})`).join(", "),
    );
  }

  console.log(
    `Localized ${String(allPokemon.length)} entries for ${supportedLanguages.join(", ")}.`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
