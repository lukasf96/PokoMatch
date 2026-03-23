import type { Habitat, Pokemon } from "../types/types";

export const habitatConflictMap: Record<Habitat, Habitat> = {
  Bright: "Dark",
  Dark: "Bright",
  Humid: "Dry",
  Dry: "Humid",
  Warm: "Cool",
  Cool: "Warm",
};

export function habitatsConflict(left: Habitat, right: Habitat): boolean {
  return habitatConflictMap[left] === right;
}

export function canJoinGroup(group: Pokemon[], candidate: Pokemon): boolean {
  return group.every(
    (member) => !habitatsConflict(member.idealHabitat, candidate.idealHabitat),
  );
}

export function getGroupHabitats(group: Pokemon[]): Habitat[] {
  return [...new Set(group.map((pokemon) => pokemon.idealHabitat))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function getGroupConflicts(group: Pokemon[]): Array<[Habitat, Habitat]> {
  const habitats = getGroupHabitats(group);
  const conflicts: Array<[Habitat, Habitat]> = [];
  for (const habitat of habitats) {
    const opposite = habitatConflictMap[habitat];
    if (habitats.includes(opposite) && habitat < opposite)
      conflicts.push([habitat, opposite]);
  }
  return conflicts;
}
