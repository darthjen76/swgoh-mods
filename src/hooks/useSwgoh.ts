import { useQuery } from '@tanstack/react-query'
import type { PlayerData, Character, Mod, ModStat } from '../types/swgoh'
import { STAT_NAMES } from '../types/swgoh'

export const COMLINK_URL = 'https://swgoh-comlink-latest-wuy6.onrender.com'

// ─── Comlink fetch (via Vercel proxy pour éviter les problèmes CORS) ──────────
async function comlinkPost(endpoint: string, payload: unknown) {
  const res = await fetch(`/api/swgoh?endpoint=${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Comlink ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ─── Mod definitionId parser ─────────────────────────────────────────────────
// Format réel Comlink: nombre 3 chiffres "{set}{rarity}{slot}"
// Ex: "751" → set=7 (Potency), rarity=5 (5 dots), slot=1 (Square)
function parseModDefinitionId(defId: string): { set: number; slot: number; rarity: number } {
  const n = parseInt(defId, 10)
  if (isNaN(n) || n < 100) return { set: 1, slot: 1, rarity: 5 }
  return {
    set:    Math.floor(n / 100),
    rarity: Math.floor((n % 100) / 10),
    slot:   n % 10,
  }
}

// ─── Stat value extraction ────────────────────────────────────────────────────
// statValueDecimal est une string représentant la valeur interne du jeu
// Les stats % sont divisées par 100000 (ex: 110000 → 1.10%)
// Les stats flat larges (speed, health) par 10000 (ex: 180000 → 18)
// Les stats flat petites (defense, offense flat) sont utilisées telles quelles
const PCT_STAT_IDS = new Set([14, 16, 17, 18, 19, 41, 42, 53, 54, 55, 56])
const LARGE_FLAT_THRESHOLD = 10000

function parseStatValue(statId: number, statValueDecimal: string): number {
  const raw = parseInt(statValueDecimal, 10)
  if (isNaN(raw)) return 0
  if (PCT_STAT_IDS.has(statId)) return raw / 100000  // → ex: 1.10 pour 1.10%
  if (raw > LARGE_FLAT_THRESHOLD)   return raw / 10000   // → ex: 18 speed, 299 health
  return raw                                              // → ex: 143 defense flat
}

function formatStatDisplay(statId: number, value: number): string {
  if (PCT_STAT_IDS.has(statId)) return `${value.toFixed(2)}%`
  return String(Math.round(value))
}

function makeModStat(
  unitStatId: number,
  statValueDecimal: string,
  roll?: number,
): ModStat {
  const value = parseStatValue(unitStatId, statValueDecimal)
  return {
    stat_id:       unitStatId,
    name:          STAT_NAMES[unitStatId] ?? `Stat ${unitStatId}`,
    value,
    display_value: formatStatDisplay(unitStatId, value),
    roll,
  }
}

// ─── Transform Comlink mod ────────────────────────────────────────────────────
function transformComlinkMod(raw: Record<string, unknown>, charId: string): Mod | null {
  try {
    const defId = raw.definitionId as string
    const { set, slot, rarity } = parseModDefinitionId(defId)
    if (!set || !slot) return null

    const ps  = raw.primaryStat as {
      stat: { unitStatId: number; statValueDecimal: string }
    }
    const primary = makeModStat(ps.stat.unitStatId, ps.stat.statValueDecimal)

    const secondaries = ((raw.secondaryStat as unknown[]) ?? []).map((s) => {
      const sec = s as {
        stat:       { unitStatId: number; statValueDecimal: string }
        statRolls:  number
      }
      return makeModStat(sec.stat.unitStatId, sec.stat.statValueDecimal, sec.statRolls)
    })

    return {
      id:              raw.id as string,
      slot,
      set,
      level:           raw.level as number,
      tier:            raw.tier as number,
      rarity,
      character:       charId,
      primary_stat:    primary,
      secondary_stats: secondaries,
    }
  } catch {
    return null
  }
}

// ─── Transform Comlink player ─────────────────────────────────────────────────
// Les vaisseaux n'ont pas de mods et ont currentTier=1 sans équipement de relic
// On filtre par: présence de mods OU currentTier > 1 (donc gear > 1)
function transformComlinkPlayer(raw: Record<string, unknown>): PlayerData {
  const roster = (raw.rosterUnit as Record<string, unknown>[]) ?? []

  const characters: Character[] = roster
    .filter((u) => {
      // Exclure les vaisseaux : ils n'ont jamais de mods et leur relic.currentTier = 1
      // Les personnages sont soit moddés, soit en train d'être montés (gear > 1)
      const relic = (u.relic as Record<string, number>)?.currentTier ?? 1
      const mods  = (u.equippedStatMod as unknown[]) ?? []
      const tier  = (u.currentTier as number) ?? 1
      return relic > 1 || mods.length > 0 || tier > 1
    })
    .map((u) => {
      const fullDefId = (u.definitionId as string) ?? ''
      const baseId    = fullDefId.split(':')[0] ?? fullDefId

      const relicRaw  = (u.relic as Record<string, number>)?.currentTier ?? 1
      const relicTier = Math.max(0, relicRaw - 2)

      const mods = ((u.equippedStatMod as unknown[]) ?? [])
        .map((m) => transformComlinkMod(m as Record<string, unknown>, baseId))
        .filter((m): m is Mod => m !== null)

      return {
        base_id:    baseId,
        name:       baseId,  // remplacé par useUnitMap() dans les composants
        image:      `https://game-assets.swgoh.gg/textures/tex.charui_${baseId.toLowerCase()}.png`,
        gear_level: (u.currentTier as number) ?? 1,
        relic_tier: relicTier,
        power:      (u.gp as number) ?? 0,
        mods,
      }
    })
    .sort((a, b) => b.power - a.power)

  return {
    ally_code:    raw.allyCode as number,
    name:         (raw.name as string) ?? 'Player',
    characters,
    last_updated: new Date().toISOString(),
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function usePlayer(allyCode: string) {
  const code = allyCode.replace(/\D/g, '')
  return useQuery({
    queryKey: ['player', code],
    queryFn: async (): Promise<PlayerData> => {
      const raw = await comlinkPost('/player', {
        payload: { allyCode: code },
        enums:   false,
      })
      return transformComlinkPlayer(raw)
    },
    enabled: code.length >= 9,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useAllMods(characters: Character[]): Mod[] {
  return characters.flatMap((c) => c.mods)
}

// ─── Unit map (swgoh.gg) ──────────────────────────────────────────────────────
// Utilisé pour les noms et images des persos — évite des appels Comlink répétés
export function useUnitMap(): Record<string, { name: string; image: string }> {
  const { data } = useQuery({
    queryKey: ['unit-map'],
    queryFn: async () => {
      const res = await fetch('/api/gg?path=units')
      if (!res.ok) return {}
      const json = await res.json()
      const map: Record<string, { name: string; image: string }> = {}
      for (const unit of (json.data ?? []) as { base_id: string; name: string; image: string }[]) {
        map[unit.base_id] = { name: unit.name, image: unit.image }
      }
      return map
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h
    retry: 1,
  })
  return data ?? {}
}
