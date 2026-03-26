import { useState } from 'react'
import { useAppStore } from '../store'
import { usePlayer } from '../hooks/useSwgoh'

export default function PlayerSetup() {
  const { allyCode, setAllyCode, setPlayerData } = useAppStore()
  const [input, setInput] = useState(allyCode)
  const [submitted, setSubmitted] = useState(false)

  const query = usePlayer(submitted ? input.replace(/\D/g, '') : '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = input.replace(/\D/g, '')
    if (code.length < 9) return
    setAllyCode(code)
    setSubmitted(true)
  }

  if (query.isSuccess && query.data) {
    setPlayerData(query.data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0e1a' }}>
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-3xl font-bold text-white tracking-wide">SWGOH</h1>
          <p className="text-blue-400 text-lg font-semibold tracking-widest uppercase">Mod Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">
              Ally Code
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setSubmitted(false)
              }}
              placeholder="123-456-789"
              className="w-full px-4 py-3 rounded-lg text-white text-lg tracking-widest outline-none transition-all"
              style={{
                background: '#111827',
                border: '1px solid #1e3a5f',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#1e3a5f')}
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
            <div className="p-3 rounded-lg text-red-400 text-sm" style={{ background: '#1a1010', border: '1px solid #7f1d1d' }}>
              Erreur : ally code invalide ou API indisponible.
            </div>
          )}
        </form>

        <p className="text-center text-slate-600 text-xs mt-8">
          Les données sont chargées depuis swgoh.gg
        </p>
      </div>
    </div>
  )
}
