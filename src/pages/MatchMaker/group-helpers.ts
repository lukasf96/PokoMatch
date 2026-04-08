import type { Habitat, Pokemon } from "../../types/types";

/** Zero-padded national dex segment for list labels (e.g. `001`). */
export function formatDexSegment(dexNumber: string): string {
  const trimmed = dexNumber.trim();
  if (/^\d+$/.test(trimmed)) return trimmed.padStart(3, "0");
  return trimmed;
}

const HABITAT_ORDER: Habitat[] = [
  "Bright",
  "Cool",
  "Dark",
  "Dry",
  "Humid",
  "Warm",
];

function emptyHabitatCounts(): Record<Habitat, number> {
  return HABITAT_ORDER.reduce<Record<Habitat, number>>((acc, habitat) => {
    acc[habitat] = 0;
    return acc;
  }, {} as Record<Habitat, number>);
}

export function groupStableKey(group: { id: string }[]): string {
  return group.map((p) => p.id).join("|");
}

export function getDisplayHabitat(group: Pokemon[]): Habitat {
  if (group.length === 0) return "Cool";
  const counts = group.reduce<Record<Habitat, number>>(
    (acc, pokemon) => {
      acc[pokemon.idealHabitat] += 1;
      return acc;
    },
    emptyHabitatCounts(),
  );
  return HABITAT_ORDER.reduce(
    (bestHabitat, habitat) =>
      counts[habitat] > counts[bestHabitat] ? habitat : bestHabitat,
    HABITAT_ORDER[0],
  );
}
