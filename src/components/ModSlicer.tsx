import { useState } from 'react'
import { useAppStore } from '../store'
import { getModsMatchingConditions } from '../store'
import type { Character, SliceCondition, StatId, SliceOperator } from '../types/swgoh'
import { STAT_NAMES } from '../types/swgoh'
import ModCard from './ModCard'

interface Props {
  character: Character
}

const OPERATORS: SliceOperator[] = ['>=', '>', '<=', '<', '=']

const SLICEABLE_STATS: Array<{ id: StatId; label: string }> = [
  { id: 5,  label: 'Speed' },
  { id: 41, label: 'Offense %' },
  { id: 42, label: 'Defense %' },
  { id: 55, label: 'Health %' },
  { id: 56, label: 'Protection %' },
  { id: 53, label: 'Crit Chance %' },
  { id: 18, label: 'Potency %' },
  { id: 19, label: 'Tenacity %' },
  { id: 48, label: 'Offense (flat)' },
  { id: 49, label: 'Defense (flat)' },
]

function ConditionRow({
  condition,
  onRemove,
  onChange,
}: {
  condition: SliceCondition
  onRemove: () => void
  onChange: (updates: Partial<SliceCondition>) => void
}) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg"
      style={{ background: '#111827', border: '1px solid #1e3a5f' }}
    >
      {/* Stat */}
      <select
        value={condition.stat_id}
        onChange={(e) => {
          const id = Number(e.target.value) as StatId
          onChange({ stat_id: id, label: buildLabel(id, condition.operator, condition.value) })
        }}
        className="flex-1 bg-transparent text-white text-sm outline-none"
        style={{ minWidth: 0 }}
      >
        {SLICEABLE_STATS.map((s) => (
          <option key={s.id} value={s.id} style={{ background: '#1a2235' }}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.operator}
        onChange={(e) => {
          const op = e.target.value as SliceOperator
          onChange({ operator: op, label: buildLabel(condition.stat_id, op, condition.value) })
        }}
        className="bg-transparent text-blue-400 font-mono text-sm outline-none"
        style={{ width: 40 }}
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op} style={{ background: '#1a2235' }}>
            {op}
          </option>
        ))}
      </select>

      {/* Value */}
      <input
        type="number"
        value={condition.value}
        onChange={(e) => {
          const v = Number(e.target.value)
          onChange({ value: v, label: buildLabel(condition.stat_id, condition.operator, v) })
        }}
        className="w-16 bg-transparent text-white text-sm text-right outline-none"
        min={0}
      />

      <button
        onClick={onRemove}
        className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

function buildLabel(statId: StatId, op: SliceOperator, value: number): string {
  const stat = SLICEABLE_STATS.find((s) => s.id === statId)?.label ?? STAT_NAMES[statId] ?? `Stat ${statId}`
  return `${stat} ${op} ${value}`
}

export default function ModSlicer({ character }: Props) {
  const { sliceConditions, addSliceCondition, removeSliceCondition, updateSliceCondition } = useAppStore()
  const [showAll, setShowAll] = useState(false)

  const matchingMods = getModsMatchingConditions(character.mods, sliceConditions)
  // Mods that do NOT match (i.e. could be upgraded to reach the threshold)
  const upgradeCandidates = character.mods.filter((m) => !matchingMods.find((mm) => mm.id === m.id))

  const addNew = () => {
    addSliceCondition({
      id: crypto.randomUUID(),
      stat_id: 5,
      operator: '>=',
      value: 15,
      label: 'Speed >= 15',
    })
  }

  return (
    <div className="space-y-5">
      {/* Conditions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Conditions de slice
          </h3>
          <button
            onClick={addNew}
            className="text-xs px-3 py-1 rounded-lg font-semibold text-white transition-colors"
            style={{ background: '#1d4ed8' }}
          >
            + Ajouter
          </button>
        </div>

        {sliceConditions.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune condition. Ajoute-en une ci-dessus.</p>
        ) : (
          <div className="space-y-2">
            {sliceConditions.map((c) => (
              <ConditionRow
                key={c.id}
                condition={c}
                onRemove={() => removeSliceCondition(c.id)}
                onChange={(updates) => updateSliceCondition(c.id, updates)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Mods à slicer
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{
              background: matchingMods.length > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
              color: matchingMods.length > 0 ? '#22c55e' : '#64748b',
            }}
          >
            {matchingMods.length}
          </span>
        </div>

        {matchingMods.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-sm">
            Aucun mod ne remplit les conditions
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {matchingMods.map((mod) => (
              <ModCard key={mod.id} mod={mod} highlight />
            ))}
          </div>
        )}
      </section>

      {/* Upgrade candidates */}
      {upgradeCandidates.length > 0 && (
        <section>
          <button
            className="flex items-center gap-2 text-sm text-slate-500 mb-3 hover:text-slate-300 transition-colors"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? '▼' : '►'} Mods ne remplissant pas les conditions ({upgradeCandidates.length})
          </button>
          {showAll && (
            <div className="grid grid-cols-2 gap-3">
              {upgradeCandidates.map((mod) => (
                <ModCard key={mod.id} mod={mod} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
