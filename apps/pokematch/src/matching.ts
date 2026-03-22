import type { Pokemon, PokemonGroup, Habitat } from './types'

/**
 * Score how well two pokemon match based on shared favorites.
 * Higher = better match.
 */
function sharedFavorites(a: Pokemon, b: Pokemon): number {
  const setB = new Set(b.favorites)
  return a.favorites.filter((f) => setB.has(f)).length
}

/**
 * Score a candidate group by summing all pairwise shared favorites.
 */
function groupScore(group: Pokemon[]): number {
  let score = 0
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      score += sharedFavorites(group[i], group[j])
    }
  }
  return score
}

/**
 * Greedily build groups of up to 4 from a list of pokemon sharing the same habitat.
 * Tries to maximize shared favorites within each group.
 */
function buildGroups(pokemon: Pokemon[]): Pokemon[][] {
  const remaining = [...pokemon]
  const groups: Pokemon[][] = []

  while (remaining.length > 0) {
    const group: Pokemon[] = [remaining.shift()!]

    while (group.length < 4 && remaining.length > 0) {
      // Find the remaining pokemon that best improves the current group
      let bestIdx = 0
      let bestScore = -1

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i]
        const score = group.reduce((sum, p) => sum + sharedFavorites(p, candidate), 0)
        if (score > bestScore) {
          bestScore = score
          bestIdx = i
        }
      }

      group.push(remaining.splice(bestIdx, 1)[0])
    }

    groups.push(group)
  }

  return groups
}

export function computeHabitatGroups(pokemon: Pokemon[]): PokemonGroup[] {
  const byHabitat = new Map<Habitat, Pokemon[]>()

  for (const p of pokemon) {
    const habitat = p.idealHabitat as Habitat
    if (!byHabitat.has(habitat)) byHabitat.set(habitat, [])
    byHabitat.get(habitat)!.push(p)
  }

  const result: PokemonGroup[] = []

  for (const [habitat, members] of byHabitat.entries()) {
    const groups = buildGroups(members)
    result.push({ habitat, pokemon: members, groups })
  }

  // Sort habitats alphabetically for consistent display
  result.sort((a, b) => a.habitat.localeCompare(b.habitat))

  return result
}

export { groupScore }
