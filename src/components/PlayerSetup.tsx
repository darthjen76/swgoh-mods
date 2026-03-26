import { useState } from 'react'
import { useAppStore } from '../store'
import { usePlayer } from '../hooks/useSwgoh'

export default function PlayerSetup() {
  const { allyCode, apiKey, setAllyCode, setApiKey, setPlayerData } = useAppStore()
  const [inputCode, setInputCode] = useState(allyCode)
  const [inputKey, setInputKey]   = useState(apiKey)
  const [submitted, setSubmitted] = useState(false)

  const query = usePlayer(
    submitted ? inputCode.replace(/\D/g, '') : '',
    submitted ? inputKey.trim() : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = inputCode.replace(/\D/g, '')
    if (code.length < 9 || !inputKey.trim()) return
    setAllyCode(code)
    setApiKey(inputKey.trim())
    setSubmitted(true)
  }

  if (query.isSuccess && query.data) {
    setPlayerData(query.data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0e1a' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-3xl font-bold text-white tracking-wide">SWGOH</h1>
          <p className="text-blue-400 text-lg font-semibold tracking-widest uppercase">Mod Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">
              Clé API swgoh.gg
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => { setInputKey(e.target.value); setSubmitted(false) }}
              placeholder="Ton token API"
              className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-all"
              style={{ background: '#111827', border: '1px solid #1e3a5f' }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e)  => (e.target.style.borderColor = '#1e3a5f')}
            />
            <p className="text-slate-500 text-xs mt-1">
              swgoh.gg → ton profil → API → Generate Token
            </p>
          </div>

          {/* Ally Code */}
          <div>
            <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">
              Ally Code
            </label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value); setSubmitted(false) }}
              placeholder="123-456-789"
              className="w-full px-4 py-3 rounded-lg text-white text-lg tracking-widest outline-none transition-all"
              style={{ background: '#111827', border: '1px solid #1e3a5f' }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e)  => (e.target.style.borderColor = '#1e3a5f')}
            />
            <p className="text-slate-500 text-xs mt-1">9 chiffres, visible dans ton profil in-game</p>
          </div>

          <button
            type="submit"
            disabled={query.isFetching}
            className="w-full py-3 rounded-lg font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
          >
            {query.isFetching ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Chargement...
              </span>
            ) : 'Charger mon roster'}
          </button>

          {query.isError && (
            <div className="p-3 rounded-lg text-red-400 text-sm space-y-1" style={{ background: '#1a1010', border: '1px solid #7f1d1d' }}>
              <div className="font-semibold">Erreur de chargement</div>
              <div className="text-red-300 text-xs font-mono break-all">
                {(query.error as Error)?.message ?? 'Erreur inconnue'}
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-slate-600 text-xs mt-8">
          Ta clé API est stockée localement dans ton navigateur uniquement.
        </p>
      </div>
    </div>
  )
}
