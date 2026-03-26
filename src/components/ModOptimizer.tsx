import { MOD_SETS, MOD_SLOTS } from '../types/swgoh'
import type { Character } from '../types/swgoh'
import { getRecommendation } from '../data/recommendations'
import { useAppStore } from '../store'

interface Props {
  character: Character
}

function MatchBadge({ match }: { match: boolean }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{
        background: match ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        color: match ? '#22c55e' : '#ef4444',
        border: `1px solid ${match ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      {match ? '✓ OK' : '✗ À changer'}
    </span>
  )
}

export default function ModOptimizer({ character }: Props) {
  const { recoVersion } = useAppStore()
  const rec = getRecommendation(character.base_id)

  const currentSets = character.mods.map((m) => m.set)
  const topSets = rec.sets.slice(0, 2).map((s) => s.set)
  const setsMatch = topSets.every((s) => currentSets.includes(s))

  const speedTotal = character.mods.reduce(
    (s, m) => s + (m.secondary_stats.find((x) => x.stat_id === 5)?.value ?? 0), 0
  )

  return (
    <div className="space-y-5">
      {/* Recommandation source */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
        style={{ background: '#111827', border: '1px solid #1e3a5f' }}
      >
        <span className="text-slate-500">
          Données meta {recoVersion ?? 'locales'}
        </span>
        <span className="text-slate-600">GAC Kyber</span>
      </div>

      {/* Best Sets */}
      <section>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          Sets recommandés
        </h3>
        <div className="space-y-2">
          {rec.sets.slice(0, 4).map((s) => {
            const setInfo = MOD_SETS[s.set]
            const isUsed = currentSets.includes(s.set)
            return (
              <div
                key={s.set}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: isUsed ? 'rgba(34,197,94,0.08)' : '#1a2235',
                  border: `1px solid ${isUsed ? 'rgba(34,197,94,0.3)' : '#1e3a5f'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: setInfo.color }} />
                  <span className="font-semibold text-white text-sm">{setInfo.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">{s.usage_pct.toFixed(0)}%</span>
                  <MatchBadge match={isUsed} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-2 text-right">
          <MatchBadge match={setsMatch} />
          <span className="text-xs text-slate-600 ml-2">Sets actuels</span>
        </div>
      </section>

      {/* Best Primaries */}
      {Object.keys(rec.primaries).length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Primary stats recommandées
          </h3>
          <div className="space-y-3">
            {([2, 3, 4, 5, 6] as const).map((slot) => {
              const primaries = rec.primaries[slot]
              if (!primaries || primaries.length === 0) return null
              const currentMod = character.mods.find((m) => m.slot === slot)
              const best = primaries[0]
              const matches = currentMod?.primary_stat.stat_id === best.stat_id
              return (
                <div key={slot}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">
                      {MOD_SLOTS[slot].shape} {MOD_SLOTS[slot].name}
                    </span>
                    {currentMod && <MatchBadge match={matches} />}
                  </div>
                  <div
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: '#111827', border: '1px solid #1e3a5f' }}
                  >
                    <div>
                      <span className="text-sm text-white font-semibold">{best.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{best.usage_pct.toFixed(0)}%</span>
                    </div>
                    {currentMod && currentMod.primary_stat.stat_id !== best.stat_id && (
                      <div className="text-xs text-red-400">Actuel: {currentMod.primary_stat.name}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Speed comparison */}
      {rec.speed_priority > 0 && (
        <section
          className="p-3 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Speed moyen Kyber</div>
              <div className="text-2xl font-bold text-blue-400">+{rec.speed_priority}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Ton speed actuel</div>
              <div
                className="text-2xl font-bold"
                style={{ color: speedTotal >= rec.speed_priority ? '#22c55e' : '#ef4444' }}
              >
                +{speedTotal}
              </div>
            </div>
          </div>
          {speedTotal < rec.speed_priority && (
            <div className="text-xs text-slate-500 mt-2">
              Il te manque {rec.speed_priority - speedTotal} de speed
            </div>
          )}
        </section>
      )}
    </div>
  )
}
