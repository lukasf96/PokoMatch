import { create } from "zustand";
import { persist, type StateStorage } from "zustand/middleware";
import { allPokemon } from "../services/pokemon";

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
  // Set of Pokemon IDs currently selected by the user
  unlockedIds: Set<string>;
  customGroups: string[][];

  setNameLanguage: (language: "en" | "de" | "fr") => void;
  setThemeMode: (mode: "system" | "light" | "dark") => void;
  togglePokemon: (id: string) => void;
  unlockAll: () => void;
  lockAll: () => void;
  addCustomGroup: () => void;
  addSuggestedGroupToCustomGroups: (pokemonIds: string[]) => void;
  deleteCustomGroup: (groupIndex: number) => void;
  addPokemonToCustomGroup: (groupIndex: number, pokemonId: string) => void;
  removePokemonFromCustomGroup: (groupIndex: number, pokemonId: string) => void;
}

// Zustand persist doesn't handle Set natively — store as array and convert
interface PersistedState {
  nameLanguage?: "en" | "de" | "fr";
  themeMode?: "system" | "light" | "dark";
  unlockedIds: string[];
  customGroups?: string[][];
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      nameLanguage: "en",
      themeMode: "system",
      unlockedIds: new Set(allIds),
      customGroups: [],

      setNameLanguage: (language) => set({ nameLanguage: language }),
      setThemeMode: (mode) => set({ themeMode: mode }),
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
      addCustomGroup: () =>
        set((state) => ({
          customGroups: [...state.customGroups, []],
        })),
      addSuggestedGroupToCustomGroups: (pokemonIds) =>
        set((state) => {
          const assignedIds = new Set(state.customGroups.flat());
          const nextGroup = pokemonIds
            .filter((pokemonId) => !assignedIds.has(pokemonId))
            .slice(0, 4);
          if (nextGroup.length === 0) return {};
          return {
            customGroups: [...state.customGroups, nextGroup],
          };
        }),
      deleteCustomGroup: (groupIndex) =>
        set((state) => ({
          customGroups: state.customGroups.filter(
            (_, index) => index !== groupIndex,
          ),
        })),
      addPokemonToCustomGroup: (groupIndex, pokemonId) =>
        set((state) => {
          const isAlreadyAssigned = state.customGroups.some((group) =>
            group.includes(pokemonId),
          );
          if (isAlreadyAssigned) return {};
          return {
            customGroups: state.customGroups.map((group, index) => {
              if (index !== groupIndex) return group;
              if (group.length >= 4) return group;
              return [...group, pokemonId];
            }),
          };
        }),
      removePokemonFromCustomGroup: (groupIndex, pokemonId) =>
        set((state) => ({
          customGroups: state.customGroups.map((group, index) =>
            index === groupIndex
              ? group.filter((id) => id !== pokemonId)
              : group,
          ),
        })),
    }),
    {
      name: "pokopia-pokematch",
      // Serialize Set → array and back
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed: { state: PersistedState; version: number } =
            JSON.parse(raw);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              nameLanguage: parsed.state.nameLanguage ?? "en",
              themeMode: parsed.state.themeMode ?? "system",
              unlockedIds: new Set(parsed.state.unlockedIds ?? allIds),
              customGroups: parsed.state.customGroups ?? [],
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
