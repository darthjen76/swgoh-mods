// ─── Mod Sets ───────────────────────────────────────────────────────────────
export const MOD_SETS: Record<number, { name: string; color: string }> = {
  1: { name: 'Health',          color: '#22c55e' },
  2: { name: 'Offense',         color: '#ef4444' },
  3: { name: 'Defense',         color: '#64748b' },
  4: { name: 'Speed',           color: '#3b82f6' },
  5: { name: 'Crit Chance',     color: '#f59e0b' },
  6: { name: 'Crit Damage',     color: '#f97316' },
  7: { name: 'Potency',         color: '#a855f7' },
  8: { name: 'Tenacity',        color: '#06b6d4' },
}

// ─── Mod Slots ───────────────────────────────────────────────────────────────
export const MOD_SLOTS: Record<number, { name: string; shape: string }> = {
  1: { name: 'Transmitter',  shape: '■' },
  2: { name: 'Receiver',     shape: '▲' },
  3: { name: 'Processor',    shape: '◆' },
  4: { name: 'Holo-Array',   shape: '▲' },
  5: { name: 'Multiplexer',  shape: '●' },
  6: { name: 'Data-Bus',     shape: '✛' },
}

// ─── Stat IDs ────────────────────────────────────────────────────────────────
export const STAT_NAMES: Record<number, string> = {
  1:  'Health',
  5:  'Speed',
  6:  'Physical Damage',
  7:  'Special Damage',
  8:  'Armor',
  9:  'Resistance',
  14: 'Crit Chance',
  16: 'Special Crit Chance',
  17: 'Crit Damage',
  18: 'Potency',
  19: 'Tenacity',
  28: 'Protection',
  41: 'Offense %',
  42: 'Defense %',
  48: 'Offense',
  49: 'Defense',
  52: 'Speed',
  53: 'Crit Chance %',
  54: 'Crit Avoidance %',
  55: 'Health %',
  56: 'Protection %',
}

export type StatId = number

export interface ModStat {
  stat_id: StatId
  name: string
  value: number
  display_value: string
  roll?: number
}

export interface Mod {
  id: string
  slot: number          // 1-6
  set: number           // 1-8
  level: number         // 1-15
  tier: number          // rarity (1-5)
  rarity: number        // dots (1-7, usually 5 or 6)
  character?: string    // base_id of equipped character
  primary_stat: ModStat
  secondary_stats: ModStat[]
}

export interface Character {
  base_id: string
  name: string
  image: string
  gear_level: number
  relic_tier: number
  power: number
  mods: Mod[]
}

export interface PlayerData {
  ally_code: number
  name: string
  characters: Character[]
  last_updated?: string
}

// ─── Best Mods Recommendation ────────────────────────────────────────────────
export interface BestModsRecommendation {
  base_id: string
  sets: Array<{ set: number; usage_pct: number }>
  primaries: Partial<Record<number, Array<{ stat_id: number; name: string; usage_pct: number }>>>
  speed_priority: number   // average speed on equipped mods (top Kyber players)
}

// ─── Saved Layouts ───────────────────────────────────────────────────────────
export interface ModLayout {
  id: string
  name: string
  created_at: string
  // character base_id → array of mod IDs
  assignments: Record<string, string[]>
}

// ─── Slice Conditions ────────────────────────────────────────────────────────
export type SliceOperator = '>=' | '>' | '<=' | '<' | '='

export interface SliceCondition {
  id: string
  stat_id: StatId
  operator: SliceOperator
  value: number
  label: string   // e.g. "Speed >= 15"
}
