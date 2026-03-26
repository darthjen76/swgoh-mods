import { useQuery } from '@tanstack/react-query'
import type { PlayerData, Character, Mod, ModStat } from '../types/swgoh'

// ─── swgoh.gg mod transform ───────────────────────────────────────────────────
// display_value est déjà formaté par swgoh.gg ("16", "3.76%", "8.50%")
// On parse juste le nombre pour les calculs (speed total, slicer)
function parseGgValue(displayValue: string): number {
  return parseFloat(displayValue.replace('%', '').trim()) || 0
}

function transformGgMod(raw: Record<string, unknown>): Mod | null {
  try {
    const set  = parseInt(String(raw.set), 10)
    const slot = raw.slot as number
    if (!set || !slot) return null

    const ps = raw.primary_stat as { stat_id: number; name: string; display_value: string }
    const primary: ModStat = {
      stat_id:       ps.stat_id,
      name:          ps.name,
      value:         parseGgValue(ps.display_value),
      display_value: ps.display_value,
    }

    type GgSec = { stat_id: number; name: string; display_value: string; roll?: number }
    const secondaries: ModStat[] = ((raw.secondary_stats as GgSec[]) ?? []).map((s) => ({
      stat_id:       s.stat_id,
      name:          s.name,
      value:         parseGgValue(s.display_value),
      display_value: s.display_value,
      roll:          s.roll,
    }))

    return {
      id:              raw.id as string,
      slot,
      set,
      level:           raw.level as number,
      tier:            raw.tier as number,
      rarity:          raw.rarity as number,
      character:       raw.character as string,
      primary_stat:    primary,
      secondary_stats: secondaries,
    }
  } catch {
    return null
  }
}

// ─── swgoh.gg player transform ────────────────────────────────────────────────
// Un seul appel /player/{allyCode}/?expand=mods donne :
//   raw.data    → infos joueur (name, ally_code, last_updated)
//   raw.mods    → tous les mods équippés avec character=base_id
//   raw.units   → roster complet avec noms, gear, relic, combat_type
function transformGgPlayer(raw: Record<string, unknown>): PlayerData {
  type GgUnit = {
    data: {
      base_id: string; name: string; combat_type: number
      gear_level: number; relic_tier: number; power: number
    }
  }
  type GgMod = Record<string, unknown> & { character?: string }

  const info  = raw.data  as { ally_code: number; name: string; last_updated?: string }
  const mods  = (raw.mods  as GgMod[])  ?? []
  const units = (raw.units as GgUnit[]) ?? []

  // Index mods par perso
  const modsByChar: Record<string, Mod[]> = {}
  for (const mod of mods) {
    const charId = mod.character
    if (!charId) continue
    const transformed = transformGgMod(mod)
    if (transformed) {
      modsByChar[charId] ??= []
      modsByChar[charId].push(transformed)
    }
  }

  const characters: Character[] = units
    .filter((u) => u.data.combat_type === 1) // exclure vaisseaux
    .map((u) => {
      const d = u.data
      return {
        base_id:    d.base_id,
        name:       d.name,
        image:      `https://game-assets.swgoh.gg/textures/tex.charui_${d.base_id.toLowerCase()}.png`,
        gear_level: d.gear_level,
        relic_tier: Math.max(0, (d.relic_tier ?? 1) - 2),
        power:      d.power ?? 0,
        mods:       modsByChar[d.base_id] ?? [],
      }
    })
    .sort((a, b) => b.power - a.power)

  return {
    ally_code:    info.ally_code,
    name:         info.name ?? 'Player',
    characters,
    last_updated: info.last_updated ?? new Date().toISOString(),
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function usePlayer(allyCode: string) {
  const code = allyCode.replace(/\D/g, '')
  return useQuery({
    queryKey: ['player', code],
    queryFn: async (): Promise<PlayerData> => {
      const res = await fetch(`/api/gg?allyCode=${code}`)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`swgoh.gg ${res.status}: ${text.slice(0, 200)}`)
      }
      const raw = await res.json()
      return transformGgPlayer(raw)
    },
    enabled: code.length >= 9,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useAllMods(characters: Character[]): Mod[] {
  return characters.flatMap((c) => c.mods)
}
