import {
  POKOPIA_LOCATIONS,
  type CustomGroup,
  type PokopiaLocation,
} from "../types/types";

export function isPokopiaLocation(value: unknown): value is PokopiaLocation {
  return (
    typeof value === "string" &&
    (POKOPIA_LOCATIONS as readonly string[]).includes(value)
  );
}

function newCustomGroupId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createCustomGroup(
  pokemonIds: string[] = [],
  location?: PokopiaLocation,
): CustomGroup {
  return {
    id: newCustomGroupId(),
    pokemonIds,
    ...(location ? { location } : {}),
  };
}

/**
 * Normalize persisted custom groups. Supports legacy `string[][]` (pre-location /
 * pre-id shape) and the current `{ id, pokemonIds, location? }` objects.
 * Array order is preserved as the user's display order.
 */
export function normalizeCustomGroups(raw: unknown): CustomGroup[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item): CustomGroup[] => {
    if (Array.isArray(item)) {
      const pokemonIds = item.filter((id): id is string => typeof id === "string");
      return [createCustomGroup(pokemonIds)];
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const pokemonIds = Array.isArray(record.pokemonIds)
        ? record.pokemonIds.filter((id): id is string => typeof id === "string")
        : [];
      const id =
        typeof record.id === "string" && record.id.length > 0
          ? record.id
          : newCustomGroupId();
      const location = isPokopiaLocation(record.location)
        ? record.location
        : undefined;
      return [
        {
          id,
          pokemonIds,
          ...(location ? { location } : {}),
        },
      ];
    }

    return [];
  });
}
