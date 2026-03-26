import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlayerData, ModLayout, SliceCondition, Mod } from '../types/swgoh'

interface AppState {
  // ─── Player ──────────────────────────────────────────────────────────────
  allyCode: string
  playerData: PlayerData | null
  setAllyCode: (code: string) => void
  setPlayerData: (data: PlayerData) => void
  clearPlayer: () => void

  // ─── Navigation ──────────────────────────────────────────────────────────
  activeTab: 'roster' | 'optimizer' | 'slicer' | 'layouts'
  selectedCharacterId: string | null
  setActiveTab: (tab: AppState['activeTab']) => void
  setSelectedCharacter: (id: string | null) => void

  // ─── Saved Layouts ───────────────────────────────────────────────────────
  layouts: ModLayout[]
  saveLayout: (name: string) => void
  deleteLayout: (id: string) => void
  applyLayout: (id: string) => void

  // ─── Slice Conditions ────────────────────────────────────────────────────
  sliceConditions: SliceCondition[]
  addSliceCondition: (condition: SliceCondition) => void
  removeSliceCondition: (id: string) => void
  updateSliceCondition: (id: string, updates: Partial<SliceCondition>) => void

  // ─── Mod filter ──────────────────────────────────────────────────────────
  modFilter: string
  setModFilter: (filter: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Player
      allyCode: '',
      playerData: null,
      setAllyCode: (code) => set({ allyCode: code }),
      setPlayerData: (data) => set({ playerData: data }),
      clearPlayer: () => set({ playerData: null, allyCode: '', selectedCharacterId: null }),

      // Navigation
      activeTab: 'roster',
      selectedCharacterId: null,
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedCharacter: (id) => set({ selectedCharacterId: id }),

      // Layouts
      layouts: [],
      saveLayout: (name) => {
        const { playerData } = get()
        if (!playerData) return
        const assignments: Record<string, string[]> = {}
        for (const char of playerData.characters) {
          assignments[char.base_id] = char.mods.map((m) => m.id)
        }
        const layout: ModLayout = {
          id: crypto.randomUUID(),
          name,
          created_at: new Date().toISOString(),
          assignments,
        }
        set((s) => ({ layouts: [...s.layouts, layout] }))
      },
      deleteLayout: (id) =>
        set((s) => ({ layouts: s.layouts.filter((l) => l.id !== id) })),
      applyLayout: (_id) => {
        // Future: swap mods in playerData to match saved layout
      },

      // Slice conditions
      sliceConditions: [
        { id: '1', stat_id: 5, operator: '>=', value: 15, label: 'Speed >= 15' },
      ],
      addSliceCondition: (condition) =>
        set((s) => ({ sliceConditions: [...s.sliceConditions, condition] })),
      removeSliceCondition: (id) =>
        set((s) => ({ sliceConditions: s.sliceConditions.filter((c) => c.id !== id) })),
      updateSliceCondition: (id, updates) =>
        set((s) => ({
          sliceConditions: s.sliceConditions.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      // Mod filter
      modFilter: '',
      setModFilter: (filter) => set({ modFilter: filter }),
    }),
    {
      name: 'swgoh-mods-storage',
      partialize: (state) => ({
        allyCode: state.allyCode,
        layouts: state.layouts,
        sliceConditions: state.sliceConditions,
      }),
    }
  )
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getModsMatchingConditions(
  mods: Mod[],
  conditions: SliceCondition[]
): Mod[] {
  if (conditions.length === 0) return []
  return mods.filter((mod) =>
    conditions.some((cond) => {
      const stat =
        mod.primary_stat.stat_id === cond.stat_id
          ? mod.primary_stat
          : mod.secondary_stats.find((s) => s.stat_id === cond.stat_id)
      if (!stat) return false
      switch (cond.operator) {
        case '>=': return stat.value >= cond.value
        case '>':  return stat.value > cond.value
        case '<=': return stat.value <= cond.value
        case '<':  return stat.value < cond.value
        case '=':  return stat.value === cond.value
        default:   return false
      }
    })
  )
}
