import type { Mod, Character } from '../types/swgoh'
import { MOD_SETS, MOD_SLOTS } from '../types/swgoh'

interface Props {
  character: Character
  portrait: string | null
}

const TIER_COLORS = ['', '#6b7280', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b']
const DOT_BG = ['', '#4b5563', '#16a34a', '#2563eb', '#7c3aed', '#d97706']

function RarityDots({ rarity, tier }: { rarity: number; tier: number }) {
  const color = DOT_BG[tier] ?? '#d97706'
  return (
    <div className="flex gap-0.5 flex-wrap">
      {Array.from({ length: Math.min(rarity, 7) }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      ))}
    </div>
  )
}

function ModSlotCell({ slot, mod }: { slot: number; mod: Mod | undefined }) {
  const slotInfo = MOD_SLOTS[slot]

  if (!mod) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl text-slate-700 text-xs"
        style={{
          background: '#0a0f1e',
          border: '1px dashed #1e3a5f',
          minHeight: 90,
          padding: '8px 6px',
        }}
      >
        <span className="text-lg opacity-20">{slotInfo.shape}</span>
        <span className="mt-1 text-center leading-tight">{slotInfo.name}</span>
      </div>
    )
  }

  const setInfo = MOD_SETS[mod.set]
  const speedStat = mod.secondary_stats.find((s) => s.stat_id === 5)
  const tierColor = TIER_COLORS[mod.tier] ?? '#6b7280'

  return (
    <div
      className="rounded-xl flex flex-col gap-1"
      style={{
        background: '#0d1526',
        border: `1px solid ${setInfo.color}55`,
        boxShadow: `0 0 8px ${setInfo.color}22`,
        padding: '7px 8px',
        minHeight: 90,
      }}
    >
      {/* Header: shape + set color + dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm leading-none" style={{ color: setInfo.color }}>{slotInfo.shape}</span>
          <span className="text-xs font-bold truncate" style={{ color: setInfo.color, maxWidth: 52 }}>
            {setInfo.name}
          </span>
        </div>
        <div className="text-xs" style={{ color: tierColor }}>L{mod.level}</div>
      </div>

      <RarityDots rarity={mod.rarity} tier={mod.tier} />

      {/* Primary stat */}
      <div className="text-xs text-slate-300 leading-tight truncate">
        <span className="text-slate-500">{slotInfo.name.split('/')[0]}: </span>
        <span className="font-semibold text-white">{mod.primary_stat.display_value}</span>
      </div>

      {/* Speed secondary — mis en avant */}
      {speedStat ? (
        <div
          className="text-xs font-bold rounded px-1 py-0.5 text-center"
          style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          +{Math.round(speedStat.value)} SPD
        </div>
      ) : (
        <div className="text-xs text-slate-700 truncate">
          {mod.secondary_stats[0]
            ? `${mod.secondary_stats[0].name}: ${mod.secondary_stats[0].display_value}`
            : '—'}
        </div>
      )}
    </div>
  )
}

// Layout calqué sur le profil in-game :
//   Gauche  [1 Square, 6 Data-Bus, 5 Multiplexer]
//   Centre  [portrait + gear/relic]
//   Droite  [2 Receiver, 3 Processor, 4 Holo-Array]
const LEFT_SLOTS  = [1, 6, 5] as const
const RIGHT_SLOTS = [2, 3, 4] as const

export default function ModHexLayout({ character, portrait }: Props) {
  const modsBySlot = new Map(character.mods.map((m) => [m.slot, m]))

  const speedTotal = character.mods.reduce(
    (s, m) => s + (m.secondary_stats.find((x) => x.stat_id === 5)?.value ?? 0), 0
  )

  return (
    <div className="flex gap-2 items-stretch">
      {/* Left column */}
      <div className="flex flex-col gap-2 flex-1">
        {LEFT_SLOTS.map((s) => (
          <ModSlotCell key={s} slot={s} mod={modsBySlot.get(s)} />
        ))}
      </div>

      {/* Center: portrait */}
      <div className="flex flex-col items-center justify-center gap-2 w-20 flex-shrink-0">
        <div className="relative">
          {portrait ? (
            <img
              src={portrait}
              alt={character.name}
              className="w-20 h-20 rounded-xl object-cover"
              style={{ border: '2px solid #1e3a5f' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl"
              style={{ background: '#111827', border: '2px solid #1e3a5f' }}>
              👤
            </div>
          )}
          {character.relic_tier > 0 && (
            <div
              className="absolute -bottom-1 -right-1 text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              R{character.relic_tier}
            </div>
          )}
          {character.relic_tier === 0 && character.gear_level > 0 && (
            <div
              className="absolute -bottom-1 -right-1 text-xs font-bold px-1 py-0.5 rounded"
              style={{ background: '#334155', color: '#94a3b8' }}
            >
              G{character.gear_level}
            </div>
          )}
        </div>

        {/* Speed total */}
        <div className="text-center">
          <div className="text-xs text-slate-500">Total SPD</div>
          <div className="text-lg font-bold text-blue-400">+{Math.round(speedTotal)}</div>
        </div>

        <div className="text-center">
          <div className="text-xs text-slate-600">{character.mods.length}/6</div>
          <div className="text-xs text-slate-600">mods</div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-2 flex-1">
        {RIGHT_SLOTS.map((s) => (
          <ModSlotCell key={s} slot={s} mod={modsBySlot.get(s)} />
        ))}
      </div>
    </div>
  )
}
