import { create } from 'zustand'
import { persist, type StateStorage } from 'zustand/middleware'
import rawData from './pokedex.json'
import type { Pokemon } from './types'

/** Debounce localStorage writes — full-state JSON on each toggle was blocking the main thread. */
function createDebouncedJsonStorage(delayMs: number): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: { name: string; value: string } | null = null

  function flush() {
    if (pending) {
      localStorage.setItem(pending.name, pending.value)
      pending = null
    }
    timer = null
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }

  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      pending = { name, value }
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(flush, delayMs)
    },
    removeItem: (name) => localStorage.removeItem(name),
  }
}

const debouncedPersistStorage = createDebouncedJsonStorage(320)

export type AppMode = 'standard' | 'custom'

const allIds = [
  ...(rawData.standard as Pokemon[]),
  ...(rawData.event as Pokemon[]),
].map((p) => p.id)

interface AppState {
  mode: AppMode
  includeEvents: boolean
  // Set of pokemon IDs the player has unlocked (only relevant in custom mode)
  unlockedIds: Set<string>

  setMode: (mode: AppMode) => void
  setIncludeEvents: (v: boolean) => void
  togglePokemon: (id: string) => void
  unlockAll: () => void
  lockAll: () => void
}

// Zustand persist doesn't handle Set natively — store as array and convert
interface PersistedState {
  mode: AppMode
  includeEvents: boolean
  unlockedIds: string[]
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      mode: 'standard',
      includeEvents: true,
      unlockedIds: new Set(allIds),

      setMode: (mode) => set({ mode }),
      setIncludeEvents: (includeEvents) => set({ includeEvents }),

      togglePokemon: (id) =>
        set((state) => {
          const next = new Set(state.unlockedIds)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return { unlockedIds: next }
        }),

      unlockAll: () => set({ unlockedIds: new Set(allIds) }),
      lockAll: () => set({ unlockedIds: new Set() }),
    }),
    {
      name: 'pokopia-pokematch',
      // Serialize Set → array and back
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name)
          if (!raw) return null
          const parsed: { state: PersistedState; version: number } = JSON.parse(raw)
          return {
            ...parsed,
            state: {
              ...parsed.state,
              unlockedIds: new Set(parsed.state.unlockedIds ?? allIds),
            },
          }
        },
        setItem: (name, value) => {
          const serializable = {
            ...value,
            state: {
              ...value.state,
              unlockedIds: [...(value.state.unlockedIds as Set<string>)],
            },
          }
          debouncedPersistStorage.setItem(name, JSON.stringify(serializable))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
)
