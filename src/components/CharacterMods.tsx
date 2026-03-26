import { useState } from 'react'
import type { Character } from '../types/swgoh'
import { MOD_SLOTS } from '../types/swgoh'
import ModCard from './ModCard'
import ModOptimizer from './ModOptimizer'
import ModSlicer from './ModSlicer'

interface Props {
  character: Character
  onBack: () => void
}

type View = 'mods' | 'optimizer' | 'slicer'

export default function CharacterMods({ character, onBack }: Props) {
  const [view, setView] = useState<View>('mods')

  const speedTotal = character.mods.reduce((sum, mod) => {
    const spd = mod.secondary_stats.find((s) => s.stat_id === 5)
    return sum + (spd?.value ?? 0)
  }, 0)

  const tabs: { id: View; label: string }[] = [
    { id: 'mods',      label: 'Mods actuels' },
    { id: 'optimizer', label: 'Optimizer' },
    { id: 'slicer',    label: 'Slicer' },
  ]

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Back + Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-blue-400 mb-4 hover:text-blue-300 transition-colors"
      >
        ← Retour au roster
      </button>

      <div className="flex items-center gap-4 mb-4">
        {character.image && (
          <img
            src={`https://swgoh.gg${character.image}`}
            alt={character.name}
            className="w-16 h-16 rounded-xl object-cover"
            style={{ border: '2px solid #1e3a5f' }}
          />
        )}
        <div>
          <h2 className="text-xl font-bold text-white">{character.name}</h2>
          <div className="text-sm text-slate-400">
            G{character.gear_level}
            {character.relic_tier > 0 && ` · R${character.relic_tier}`}
            {' · '}
            <span className="text-blue-400 font-semibold">+{speedTotal} SPD total</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-lg p-1 mb-4 gap-1"
        style={{ background: '#111827' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className="flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all"
            style={{
              background: view === tab.id ? '#1d4ed8' : 'transparent',
              color: view === tab.id ? '#fff' : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'mods' && (
        <div>
          {character.mods.length === 0 ? (
            <div className="text-center text-slate-500 py-12">Aucun mod équipé</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {([1, 2, 3, 4, 5, 6] as const).map((slot) => {
                const mod = character.mods.find((m) => m.slot === slot)
                return mod ? (
                  <ModCard key={slot} mod={mod} />
                ) : (
                  <div
                    key={slot}
                    className="rounded-xl p-3 flex items-center justify-center text-slate-600 text-sm"
                    style={{ background: '#111827', border: '1px dashed #1e3a5f', minHeight: 120 }}
                  >
                    <div className="text-center">
                      <div className="text-2xl opacity-30">{MOD_SLOTS[slot].shape}</div>
                      <div className="text-xs mt-1">{MOD_SLOTS[slot].name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === 'optimizer' && <ModOptimizer character={character} />}
      {view === 'slicer' && <ModSlicer character={character} />}
    </div>
  )
}
