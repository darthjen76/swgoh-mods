import type { VercelRequest, VercelResponse } from '@vercel/node'

const COMLINK = 'https://swgoh-comlink-latest-wuy6.onrender.com'
// Note: SWGOH_API_KEY est la clé swgoh.gg (dc38b), utilisée par api/gg.ts

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const endpoint = (req.query.endpoint as string) || '/player'

  try {
    const upstream = await fetch(`${COMLINK}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(upstream.status).json({ error: `Comlink ${upstream.status}: ${text.slice(0, 200)}` })
    }

    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
    return res.status(200).json(data)
  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: 'Failed to reach Comlink' })
  }
}
