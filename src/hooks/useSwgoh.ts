import { useQuery } from '@tanstack/react-query'
import type { PlayerData, BestModsRecommendation, Character, Mod, ModStat } from '../types/swgoh'

// Proxy path — in dev Vite proxies /api → localhost:3001, in prod → Vercel function
const proxyFetch = async (path: string) => {
  const res = await fetch(`/api/swgoh?path=${encodeURIComponent(path)}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ─── Transform raw swgoh.gg player response ──────────────────────────────────
function transformStat(raw: { stat_id: number; name: string; value: number | string; display_value?: string; roll?: number }): ModStat {
  return {
    stat_id: raw.stat_id,
    name: raw.name,
    value: Number(raw.value),
    display_value: raw.display_value ?? String(raw.value),
    roll: raw.roll,
  }
}

function transformMod(raw: Record<string, unknown>, charId: string): Mod {
  return {
    id: raw.id as string,
    slot: raw.slot as number,
    set: raw.set as number,
    level: raw.level as number,
    tier: raw.tier as number,
    rarity: (raw.rarity as number) ?? (raw.dot as number) ?? 1,
    character: charId,
    primary_stat: transformStat(raw.primary_stat as Parameters<typeof transformStat>[0]),
    secondary_stats: ((raw.secondary_stats as unknown[]) ?? []).map((s) =>
      transformStat(s as Parameters<typeof transformStat>[0])
    ),
  }
}

function transformPlayer(raw: Record<string, unknown>): PlayerData {
  const units = (raw.units as Record<string, unknown>[]) ?? []
  const characters: Character[] = units
    .filter((u) => {
      const d = u.data as Record<string, unknown>
      return d && !d.is_ship
    })
    .map((u) => {
      const d = u.data as Record<string, unknown>
      const baseId = d.base_id as string
      return {
        base_id: baseId,
        name: d.name as string,
        image: d.image as string,
        gear_level: d.gear_level as number,
        relic_tier: ((d.relic_currentTier as number) ?? 0) - 2,
        power: d.power as number,
        mods: ((d.mods as unknown[]) ?? []).map((m) =>
          transformMod(m as Record<string, unknown>, baseId)
        ),
      }
    })
    .sort((a, b) => b.power - a.power)

  return {
    ally_code: raw.ally_code as number,
    name: (raw.data as Record<string, unknown>)?.name as string ?? 'Player',
    characters,
    last_updated: new Date().toISOString(),
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function usePlayer(allyCode: string) {
  return useQuery({
    queryKey: ['player', allyCode],
    queryFn: async (): Promise<PlayerData> => {
      const raw = await proxyFetch(`players/${allyCode}/`)
      return transformPlayer(raw)
    },
    enabled: allyCode.length >= 9,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

// Best mods per character from top Kyber GAC players on swgoh.gg
export function useBestMods(baseId: string | null) {
  return useQuery({
    queryKey: ['best-mods', baseId],
    queryFn: async (): Promise<BestModsRecommendation> => {
      const raw = await proxyFetch(`units/${baseId}/best-mods/`)
      // Transform swgoh.gg best-mods response
      const sets = (raw.best_mods_sets as Array<{ set: number; count: number; percent: number }> ?? [])
        .map((s) => ({ set: s.set, usage_pct: s.percent }))
        .sort((a, b) => b.usage_pct - a.usage_pct)

      const primaries: BestModsRecommendation['primaries'] = {}
      const primaryData = raw.best_mods_primaries as Record<string, Array<{ stat_id: number; name: string; count: number; percent: number }>> ?? {}
      for (const [slot, stats] of Object.entries(primaryData)) {
        primaries[Number(slot)] = stats
          .map((s) => ({ stat_id: s.stat_id, name: s.name, usage_pct: s.percent }))
          .sort((a, b) => b.usage_pct - a.usage_pct)
      }

      return {
        base_id: baseId!,
        sets,
        primaries,
        speed_priority: (raw.avg_speed as number) ?? 0,
      }
    },
    enabled: !!baseId,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })
}

export function useAllMods(characters: Character[]): Mod[] {
  return characters.flatMap((c) => c.mods)
}
