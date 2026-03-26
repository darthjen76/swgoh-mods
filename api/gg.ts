import type { VercelRequest, VercelResponse } from '@vercel/node'

const GG_API = 'https://swgoh.gg/api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const path = (req.query.path as string) || 'units'
  const apiKey = process.env.SWGOH_GG_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'SWGOH_GG_API_KEY not configured' })
  }

  try {
    const upstream = await fetch(`${GG_API}/${path}/`, {
      headers: { 'x-gg-bot-access': apiKey },
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(upstream.status).json({ error: `swgoh.gg ${upstream.status}: ${text.slice(0, 200)}` })
    }

    const data = await upstream.json()
    // Cache 24h — les noms/images de persos changent rarement
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
    return res.status(200).json(data)
  } catch (err) {
    console.error('gg proxy error:', err)
    return res.status(500).json({ error: 'Failed to reach swgoh.gg' })
  }
}
