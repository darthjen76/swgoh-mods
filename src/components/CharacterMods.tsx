import { useState } from 'react'
import type { Character } from '../types/swgoh'
import { useUnitMap } from '../hooks/useSwgoh'
import ModHexLayout from './ModHexLayout'
import ModOptimizer from './ModOptimizer'
import ModSlicer from './ModSlicer'

interface Props {
  character: Character
  onBack: () => void
}

type View = 'mods' | 'optimizer' | 'slicer'

const tabs: { id: View; label: string }[] = [
  { id: 'mods',      label: 'Mods' },
  { id: 'optimizer', label: 'Optimizer' },
  { id: 'slicer',    label: 'Slicer' },
]

export default function CharacterMods({ character, onBack }: Props) {
  const [view, setView] = useState<View>('mods')
  const unitMap = useUnitMap()

  const displayName  = unitMap[character.base_id]?.name  ?? character.name
  const displayImage = unitMap[character.base_id]?.image ?? character.image

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-blue-400 mb-4 hover:text-blue-300 transition-colors"
      >
        ← Retour au roster
      </button>

      {/* Character header */}
      <div className="flex items-center gap-4 mb-4">
        {displayImage && (
          <img
            src={displayImage}
            alt={displayName}
            className="w-16 h-16 rounded-xl object-cover"
            style={{ border: '2px solid #1e3a5f' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div>
          <h2 className="text-xl font-bold text-white">{displayName}</h2>
          <div className="text-sm text-slate-400">
            G{character.gear_level}
            {character.relic_tier > 0 && ` · R${character.relic_tier}`}
            {' · '}{character.power.toLocaleString()} GP
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg p-1 mb-4 gap-1" style={{ background: '#111827' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className="flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all"
            style={{
              background: view === tab.id ? '#1d4ed8' : 'transparent',
              color:      view === tab.id ? '#fff'    : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'mods' && (
        character.mods.length === 0 ? (
          <div className="text-center text-slate-500 py-12">Aucun mod équipé</div>
        ) : (
          <ModHexLayout character={character} portrait={displayImage ?? null} />
        )
      )}
      {view === 'optimizer' && <ModOptimizer character={character} />}
      {view === 'slicer'    && <ModSlicer    character={character} />}
    </div>
  )
}
