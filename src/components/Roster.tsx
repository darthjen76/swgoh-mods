import { useState } from 'react'
import { useAppStore } from '../store'
import CharacterMods from './CharacterMods'
import type { Character } from '../types/swgoh'

function CharacterCard({ char, onClick }: { char: Character; onClick: () => void }) {
  const speedTotal = char.mods.reduce((sum, mod) => {
    const spd = mod.secondary_stats.find((s) => s.stat_id === 5)
    return sum + (spd?.value ?? 0)
  }, 0)

  const modCount = char.mods.length

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: '#1a2235',
        border: '1px solid #1e3a5f',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#3b82f6')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#1e3a5f')}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {char.image ? (
            <img
              src={`https://swgoh.gg${char.image}`}
              alt={char.name}
              className="w-14 h-14 rounded-lg object-cover"
              style={{ border: '2px solid #1e3a5f' }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl"
              style={{ background: '#111827' }}
            >
              👤
            </div>
          )}
          {char.relic_tier > 0 && (
            <div
              className="absolute -bottom-1 -right-1 text-xs font-bold px-1 rounded"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              R{char.relic_tier}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">{char.name}</div>
          <div className="text-xs text-slate-500">
            G{char.gear_level} · {char.power.toLocaleString()} GP
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-blue-400 font-semibold">
              {speedTotal > 0 ? `+${speedTotal} SPD` : 'Pas de mods'}
            </span>
            <span className="text-xs text-slate-600">
              {modCount}/6 mods
            </span>
          </div>
        </div>

        <div className="text-slate-600 text-lg">›</div>
      </div>
    </button>
  )
}

export default function Roster() {
  const { playerData, selectedCharacterId, setSelectedCharacter } = useAppStore()
  const [search, setSearch] = useState('')

  if (!playerData) return null

  if (selectedCharacterId) {
    const char = playerData.characters.find((c) => c.base_id === selectedCharacterId)
    if (char) return <CharacterMods character={char} onBack={() => setSelectedCharacter(null)} />
  }

  const filtered = playerData.characters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-white">{playerData.name}</h2>
          <span className="text-xs text-slate-500">
            {playerData.characters.length} personnages
          </span>
        </div>

        <input
          type="text"
          placeholder="Rechercher un personnage..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white text-sm outline-none"
          style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.target.style.borderColor = '#1e3a5f')}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((char) => (
          <CharacterCard
            key={char.base_id}
            char={char}
            onClick={() => setSelectedCharacter(char.base_id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-12">Aucun résultat</div>
        )}
      </div>
    </div>
  )
}
