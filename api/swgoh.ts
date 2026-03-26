import type { VercelRequest, VercelResponse } from '@vercel/node'

const SWGOH_API_BASE = 'https://swgoh.gg/api'
const API_KEY = process.env.SWGOH_API_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'SWGOH_API_KEY not configured' })
  }

  // Extract path after /api/swgoh  e.g. /api/swgoh/players/123456789/
  const path = (req.query.path as string) || ''
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' })
  }

  const url = `${SWGOH_API_BASE}/${path}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `swgoh.gg API error: ${response.statusText}`,
      })
    }

    const data = await response.json()
    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
    return res.status(200).json(data)
  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: 'Failed to fetch from swgoh.gg' })
  }
}
