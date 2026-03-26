import type { Mod } from '../types/swgoh'
import { MOD_SETS, MOD_SLOTS } from '../types/swgoh'

interface Props {
  mod: Mod
  highlight?: boolean
  compact?: boolean
}

const TIER_COLORS = ['', '#6b7280', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b']
const DOT_COLORS  = ['', '#6b7280', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4']

function Dots({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: DOT_COLORS[count] ?? '#fff' }}
        />
      ))}
    </div>
  )
}

export default function ModCard({ mod, highlight, compact }: Props) {
  const setInfo  = MOD_SETS[mod.set]
  const slotInfo = MOD_SLOTS[mod.slot]
  const tierColor = TIER_COLORS[mod.tier] ?? '#6b7280'
  const speedStat = mod.secondary_stats.find((s) => s.stat_id === 5)
  const speedVal  = speedStat?.value ?? 0

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: '#1a2235',
          border: `1px solid ${highlight ? '#3b82f6' : '#1e3a5f'}`,
        }}
      >
        <span className="text-lg" title={slotInfo.name}>{slotInfo.shape}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: setInfo.color }}>
            {setInfo.name}
          </div>
          <div className="text-xs text-slate-400 truncate">{mod.primary_stat.name}</div>
        </div>
        {speedVal > 0 && (
          <span className="text-xs font-bold text-blue-400">+{speedVal} SPD</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-3 space-y-2 transition-all"
      style={{
        background: '#1a2235',
        border: `1px solid ${highlight ? '#3b82f6' : '#1e3a5f'}`,
        boxShadow: highlight ? '0 0 12px rgba(59,130,246,0.3)' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" title={slotInfo.name}>{slotInfo.shape}</span>
          <div>
            <div className="text-xs font-bold" style={{ color: setInfo.color }}>{setInfo.name}</div>
            <div className="text-xs text-slate-500">{slotInfo.name}</div>
          </div>
        </div>
        <div className="text-right">
          <Dots count={mod.rarity} />
          <div className="text-xs mt-0.5" style={{ color: tierColor }}>
            Lvl {mod.level}
          </div>
        </div>
      </div>

      {/* Primary stat */}
      <div
        className="px-2 py-1 rounded text-sm font-semibold text-white"
        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        {mod.primary_stat.name}: {mod.primary_stat.display_value}
      </div>

      {/* Secondary stats */}
      <div className="space-y-1">
        {mod.secondary_stats.map((stat, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs px-1"
          >
            <span className={stat.stat_id === 5 ? 'text-blue-400 font-semibold' : 'text-slate-400'}>
              {stat.name}
            </span>
            <div className="flex items-center gap-1">
              {stat.roll !== undefined && (
                <span className="text-slate-600">×{stat.roll}</span>
              )}
              <span className={stat.stat_id === 5 ? 'text-blue-300 font-bold' : 'text-slate-300'}>
                {stat.stat_id === 5 ? '+' : ''}{stat.display_value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
