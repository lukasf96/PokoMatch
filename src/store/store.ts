import { create } from "zustand";
import { persist, type StateStorage } from "zustand/middleware";
import { allPokemon } from "../services/pokemon";
import type { CustomGroup, PokopiaLocation } from "../types/types";
import { createCustomGroup, normalizeCustomGroups } from "./customGroups";

/** Debounce localStorage writes — full-state JSON on each toggle was blocking the main thread. */
function createDebouncedJsonStorage(delayMs: number): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { name: string; value: string } | null = null;

  function flush() {
    if (pending) {
      localStorage.setItem(pending.name, pending.value);
      pending = null;
    }
    timer = null;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      pending = { name, value };
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    removeItem: (name) => localStorage.removeItem(name),
  };
}

const debouncedPersistStorage = createDebouncedJsonStorage(320);

const allIds = allPokemon.map((pokemon) => pokemon.id);

interface AppState {
  nameLanguage: "en" | "de" | "fr";
  themeMode: "system" | "light" | "dark";
  preferEvolutionLinesInMatching: boolean;
  // Set of Pokemon IDs currently selected by the user
  unlockedIds: Set<string>;
  /** Display order is array order (user-reorderable via drag and drop). */
  customGroups: CustomGroup[];

  setNameLanguage: (language: "en" | "de" | "fr") => void;
  setThemeMode: (mode: "system" | "light" | "dark") => void;
  setPreferEvolutionLinesInMatching: (value: boolean) => void;
  togglePokemon: (id: string) => void;
  unlockAll: () => void;
  lockAll: () => void;
  unlockMany: (ids: readonly string[]) => void;
  lockMany: (ids: readonly string[]) => void;
  addCustomGroup: () => void;
  addSuggestedGroupToCustomGroups: (pokemonIds: string[]) => void;
  deleteCustomGroup: (groupIndex: number) => void;
  reorderCustomGroups: (activeId: string, overId: string) => void;
  setCustomGroupLocation: (
    groupIndex: number,
    location: PokopiaLocation | undefined,
  ) => void;
  addPokemonToCustomGroup: (groupIndex: number, pokemonId: string) => void;
  removePokemonFromCustomGroup: (groupIndex: number, pokemonId: string) => void;
  /** Replace Pokédex unlocks and saved groups (used by transfer import). */
  replaceCollectionData: (data: {
    unlockedIds: readonly string[];
    customGroups: readonly CustomGroup[];
  }) => void;
}

// Zustand persist doesn't handle Set natively — store as array and convert
interface PersistedState {
  nameLanguage?: "en" | "de" | "fr";
  themeMode?: "system" | "light" | "dark";
  preferEvolutionLinesInMatching?: boolean;
  unlockedIds: string[];
  /** Legacy `string[][]` or current `CustomGroup[]`. */
  customGroups?: unknown;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      nameLanguage: "en",
      themeMode: "system",
      preferEvolutionLinesInMatching: false,
      unlockedIds: new Set(allIds),
      customGroups: [],

      setNameLanguage: (language) => set({ nameLanguage: language }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setPreferEvolutionLinesInMatching: (value) =>
        set({ preferEvolutionLinesInMatching: value }),
      togglePokemon: (id) =>
        set((state) => {
          const next = new Set(state.unlockedIds);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return { unlockedIds: next };
        }),

      unlockAll: () => set({ unlockedIds: new Set(allIds) }),
      lockAll: () => set({ unlockedIds: new Set() }),
      unlockMany: (ids) =>
        set((state) => {
          const next = new Set(state.unlockedIds);
          for (const id of ids) next.add(id);
          return { unlockedIds: next };
        }),
      lockMany: (ids) =>
        set((state) => {
          const next = new Set(state.unlockedIds);
          for (const id of ids) next.delete(id);
          return { unlockedIds: next };
        }),
      addCustomGroup: () =>
        set((state) => ({
          customGroups: [...state.customGroups, createCustomGroup()],
        })),
      addSuggestedGroupToCustomGroups: (pokemonIds) =>
        set((state) => {
          const assignedIds = new Set(
            state.customGroups.flatMap((group) => group.pokemonIds),
          );
          const nextGroupIds = pokemonIds
            .filter((pokemonId) => !assignedIds.has(pokemonId))
            .slice(0, 4);
          if (nextGroupIds.length === 0) return {};
          return {
            customGroups: [
              ...state.customGroups,
              createCustomGroup(nextGroupIds),
            ],
          };
        }),
      deleteCustomGroup: (groupIndex) =>
        set((state) => ({
          customGroups: state.customGroups.filter(
            (_, index) => index !== groupIndex,
          ),
        })),
      reorderCustomGroups: (activeId, overId) =>
        set((state) => {
          if (activeId === overId) return {};
          const fromIndex = state.customGroups.findIndex(
            (group) => group.id === activeId,
          );
          const toIndex = state.customGroups.findIndex(
            (group) => group.id === overId,
          );
          if (fromIndex < 0 || toIndex < 0) return {};
          const next = [...state.customGroups];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return { customGroups: next };
        }),
      setCustomGroupLocation: (groupIndex, location) =>
        set((state) => ({
          customGroups: state.customGroups.map((group, index) => {
            if (index !== groupIndex) return group;
            if (location === undefined) {
              return { id: group.id, pokemonIds: group.pokemonIds };
            }
            return { ...group, location };
          }),
        })),
      addPokemonToCustomGroup: (groupIndex, pokemonId) =>
        set((state) => {
          const isAlreadyAssigned = state.customGroups.some((group) =>
            group.pokemonIds.includes(pokemonId),
          );
          if (isAlreadyAssigned) return {};
          return {
            customGroups: state.customGroups.map((group, index) => {
              if (index !== groupIndex) return group;
              if (group.pokemonIds.length >= 4) return group;
              return {
                ...group,
                pokemonIds: [...group.pokemonIds, pokemonId],
              };
            }),
          };
        }),
      removePokemonFromCustomGroup: (groupIndex, pokemonId) =>
        set((state) => ({
          customGroups: state.customGroups.map((group, index) =>
            index === groupIndex
              ? {
                  ...group,
                  pokemonIds: group.pokemonIds.filter((id) => id !== pokemonId),
                }
              : group,
          ),
        })),
      replaceCollectionData: ({ unlockedIds, customGroups }) =>
        set({
          unlockedIds: new Set(unlockedIds),
          customGroups: customGroups.map((group) => ({
            id: group.id,
            pokemonIds: [...group.pokemonIds],
            ...(group.location ? { location: group.location } : {}),
          })),
        }),
    }),
    {
      name: "pokomatch",
      // Serialize Set → array and back; migrate legacy customGroups shapes
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed: { state: PersistedState; version: number } =
            JSON.parse(raw);
          const customGroups = normalizeCustomGroups(parsed.state.customGroups);
          const rawGroups = parsed.state.customGroups;
          const needsCustomGroupsRewrite =
            Array.isArray(rawGroups) &&
            rawGroups.some((item) => {
              if (Array.isArray(item)) return true;
              if (!item || typeof item !== "object") return true;
              const id = (item as { id?: unknown }).id;
              return typeof id !== "string" || id.length === 0;
            });

          // Persist migrated group objects immediately so generated ids stay stable
          // across reloads (legacy shape was `string[][]`).
          if (needsCustomGroupsRewrite) {
            localStorage.setItem(
              name,
              JSON.stringify({
                ...parsed,
                state: {
                  ...parsed.state,
                  customGroups,
                },
              }),
            );
          }

          return {
            ...parsed,
            state: {
              ...parsed.state,
              nameLanguage: parsed.state.nameLanguage ?? "en",
              themeMode: parsed.state.themeMode ?? "system",
              preferEvolutionLinesInMatching:
                parsed.state.preferEvolutionLinesInMatching ?? false,
              unlockedIds: new Set(parsed.state.unlockedIds ?? allIds),
              customGroups,
            },
          };
        },
        setItem: (name, value) => {
          const serializable = {
            ...value,
            state: {
              ...value.state,
              unlockedIds: [...(value.state.unlockedIds as Set<string>)],
            },
          };
          debouncedPersistStorage.setItem(name, JSON.stringify(serializable));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
