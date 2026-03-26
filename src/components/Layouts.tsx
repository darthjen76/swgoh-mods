import { useState } from 'react'
import { useAppStore } from '../store'

export default function Layouts() {
  const { playerData, layouts, saveLayout, deleteLayout } = useAppStore()
  const [newName, setNewName] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!newName.trim() || !playerData) return
    saveLayout(newName.trim())
    setNewName('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Layouts sauvegardés</h2>
        <p className="text-sm text-slate-500">
          Sauvegarde la configuration de mods actuelle de tout ton roster.
        </p>
      </div>

      {/* Save new layout */}
      {playerData && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ background: '#1a2235', border: '1px solid #1e3a5f' }}
        >
          <h3 className="text-sm font-semibold text-slate-300">Sauvegarder le roster actuel</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nom du layout (ex: GAC Offense)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: '#111827', border: '1px solid #1e3a5f' }}
            />
            <button
              onClick={handleSave}
              disabled={!newName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: '#1d4ed8' }}
            >
              {saved ? '✓ Sauvé' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {/* Layout list */}
      {layouts.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <div className="text-4xl mb-3">💾</div>
          <p>Aucun layout sauvegardé</p>
          <p className="text-xs mt-1">Charge ton roster puis sauvegarde-le</p>
        </div>
      ) : (
        <div className="space-y-3">
          {layouts.map((layout) => {
            const charCount = Object.keys(layout.assignments).length
            const modCount  = Object.values(layout.assignments).reduce((s, mods) => s + mods.length, 0)
            const date = new Date(layout.created_at).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
            return (
              <div
                key={layout.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: '#1a2235', border: '1px solid #1e3a5f' }}
              >
                <div>
                  <div className="font-semibold text-white">{layout.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {charCount} personnages · {modCount} mods · {date}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteLayout(layout.id)}
                    className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
