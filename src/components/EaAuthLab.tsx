import { useState } from 'react'

type Step = 'email' | 'code' | 'done' | 'error'

interface EaState {
  execution: string
  initref:   string
  cookies:   Record<string, string>
}

export default function EaAuthLab() {
  const [step,    setStep]    = useState<Step>('email')
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [state,   setState]   = useState<EaState | null>(null)
  const [result,  setResult]  = useState<{ token: string; nucleusId: string } | null>(null)

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/ea-auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'start', email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setState(data.state)
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!state) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/ea-auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'verify', code, state }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setResult(data)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('email'); setEmail(''); setCode('')
    setState(null); setResult(null); setError(null)
  }

  const inputStyle = { background: '#111827', border: '1px solid #1e3a5f', color: '#fff' }
  const focusStyle = { borderColor: '#3b82f6' }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="rounded-xl p-3 text-xs space-y-1"
        style={{ background: '#0f172a', border: '1px solid #1e3a5f' }}>
        <div className="font-bold text-yellow-400 uppercase tracking-wider">⚗ Lab — EA Connect</div>
        <div className="text-slate-500">Test d'authentification EA pour accéder à tous les mods (équippés + inventaire).</div>
      </div>

      {/* Step 1 — Email */}
      {step === 'email' && (
        <form onSubmit={sendEmail} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Email EA</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e)  => Object.assign(e.target.style, inputStyle)}
            />
          </div>
          <button type="submit" disabled={loading || !email}
            className="w-full py-3 rounded-lg font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
            {loading ? 'Envoi…' : 'Envoyer le code'}
          </button>
        </form>
      )}

      {/* Step 2 — OTP code */}
      {step === 'code' && (
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="text-sm text-slate-400 rounded-lg px-3 py-2"
            style={{ background: '#0f172a', border: '1px solid #1e3a5f' }}>
            Code envoyé sur <span className="text-white font-semibold">{email}</span>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Code reçu par email</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={8}
              className="w-full px-4 py-3 rounded-lg text-white text-2xl tracking-widest text-center outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e)  => Object.assign(e.target.style, inputStyle)}
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading || code.length < 4}
            className="w-full py-3 rounded-lg font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
            {loading ? 'Vérification…' : 'Connexion'}
          </button>
          <button type="button" onClick={reset}
            className="w-full py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Recommencer
          </button>
        </form>
      )}

      {/* Done */}
      {step === 'done' && result && (
        <div className="space-y-3">
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="font-bold text-green-400">✓ Authentification réussie</div>
            {result.nucleusId && (
              <div className="text-xs text-slate-400">Nucleus ID: <span className="text-slate-300">{result.nucleusId}</span></div>
            )}
          </div>
          <div className="rounded-xl p-3 space-y-1" style={{ background: '#0f172a', border: '1px solid #1e3a5f' }}>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Token EA</div>
            <div className="text-xs font-mono text-slate-400 break-all">{result.token.slice(0, 80)}…</div>
          </div>
          <button onClick={reset}
            className="w-full py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Recommencer
          </button>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="font-bold text-red-400 mb-1">Erreur</div>
            <div className="text-xs text-red-300 font-mono break-all">{error}</div>
          </div>
          <button onClick={reset}
            className="w-full py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Recommencer
          </button>
        </div>
      )}
    </div>
  )
}
