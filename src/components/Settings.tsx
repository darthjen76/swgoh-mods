import { useState } from 'react'
import { useAppStore } from '../store'
import { RECOMMENDATIONS_UPDATE_URL } from '../data/recommendations'

export default function Settings() {
  const { recoVersion, setRecoVersion, clearPlayer, allyCode } = useAppStore()
  const [updating, setUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<'success' | 'error' | null>(null)

  const handleUpdateReco = async () => {
    setUpdating(true)
    setUpdateResult(null)
    try {
      const res = await fetch(RECOMMENDATIONS_UPDATE_URL + '?t=' + Date.now())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setRecoVersion(json.version ?? new Date().toLocaleDateString('fr-FR'))
      setUpdateResult('success')
    } catch {
      setUpdateResult('error')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Paramètres</h2>

      {/* Compte */}
      <section
        className="p-4 rounded-xl space-y-3"
        style={{ background: '#1a2235', border: '1px solid #1e3a5f' }}
      >
        <h3 className="text-sm font-semibold text-slate-300">Compte</h3>
        <div className="text-sm text-slate-400">
          Ally code : <span className="text-white font-mono">{allyCode || '—'}</span>
        </div>
        <button
          onClick={clearPlayer}
          className="text-sm px-4 py-2 rounded-lg text-red-400 transition-colors"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          Changer de compte
        </button>
      </section>

      {/* Recommandations */}
      <section
        className="p-4 rounded-xl space-y-3"
        style={{ background: '#1a2235', border: '1px solid #1e3a5f' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Recommandations GAC Kyber</h3>
          {recoVersion && (
            <span className="text-xs text-slate-500">v{recoVersion}</span>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Les recommandations de mods sont basées sur les données des top joueurs Kyber.
          Clique sur "Mettre à jour" pour récupérer la dernière version depuis GitHub.
        </p>

        <button
          onClick={handleUpdateReco}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
          style={{ background: '#1d4ed8' }}
        >
          {updating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Mise à jour...
            </>
          ) : '↻ Mettre à jour les recommandations'}
        </button>

        {updateResult === 'success' && (
          <div className="text-xs text-green-400 flex items-center gap-1">
            ✓ Recommandations mises à jour — version {recoVersion}
          </div>
        )}
        {updateResult === 'error' && (
          <div className="text-xs text-red-400">
            Erreur lors de la mise à jour. Vérifie ta connexion.
          </div>
        )}
      </section>

      {/* À venir */}
      <section
        className="p-4 rounded-xl"
        style={{ background: '#111827', border: '1px dashed #1e3a5f' }}
      >
        <h3 className="text-sm font-semibold text-slate-600 mb-1">Bientôt disponible</h3>
        <p className="text-xs text-slate-600">
          Connexion directe au compte via l'API officielle du jeu (Comlink) — roster en temps réel sans clé API.
        </p>
      </section>
    </div>
  )
}
