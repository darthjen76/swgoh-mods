import type { VercelRequest, VercelResponse } from '@vercel/node'

const GG_API = 'https://swgoh.gg/api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const apiKey = process.env.SWGOH_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'SWGOH_API_KEY not configured' })

  const allyCode = req.query.allyCode as string | undefined
  const path     = (req.query.path as string) || 'units'

  // Player data: roster + mods en un seul appel (5min cache)
  // Données statiques (units, etc.) : 24h cache
  const url          = allyCode ? `${GG_API}/player/${allyCode}/?expand=mods` : `${GG_API}/${path}/`
  const cacheControl = allyCode ? 's-maxage=300, stale-while-revalidate=60' : 's-maxage=86400, stale-while-revalidate=3600'

  try {
    const upstream = await fetch(url, {
      headers: { 'x-gg-bot-access': apiKey },
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(upstream.status).json({ error: `swgoh.gg ${upstream.status}: ${text.slice(0, 200)}` })
    }

    const data = await upstream.json()
    res.setHeader('Cache-Control', cacheControl)
    return res.status(200).json(data)
  } catch (err) {
    console.error('gg proxy error:', err)
    return res.status(500).json({ error: 'Failed to reach swgoh.gg' })
  }
}
