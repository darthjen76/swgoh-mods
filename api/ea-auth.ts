/**
 * EA Auth flow (email + OTP)
 *
 * POST /api/ea-auth  { action: 'start',  email: string }
 *   → { state: EaState }
 *
 * POST /api/ea-auth  { action: 'verify', code: string, state: EaState }
 *   → { token: string, nucleusId: string }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const CLIENT_ID    = 'SWGOH_SERVER_WEB_APP'
const REDIRECT_URI = 'https://store.galaxy-of-heroes.starwars.ea.com'
const SIGNIN_HOST  = 'https://signin.ea.com'
const ACCOUNTS_URL = 'https://accounts.ea.com'
const UA           = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

// ─── Cookie helpers ───────────────────────────────────────────────────────────
function parseCookies(setCookieHeaders: string[]): Record<string, string> {
  const jar: Record<string, string> = {}
  for (const header of setCookieHeaders) {
    const part = header.split(';')[0]
    const idx  = part.indexOf('=')
    if (idx > 0) jar[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return jar
}

function serializeCookies(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

function mergeCookies(jar: Record<string, string>, headers: string[]): Record<string, string> {
  return { ...jar, ...parseCookies(headers) }
}

function getSetCookies(res: Response): string[] {
  // Node 18 fetch (undici) exposes getSetCookie()
  // @ts-expect-error - getSetCookie not in all TS typings
  return typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') ?? '').split(',').filter(Boolean)
}

// ─── EA auth state (passed between start/verify calls) ───────────────────────
export interface EaState {
  execution: string
  initref:   string
  cookies:   Record<string, string>
}

// ─── Step 1: initiate flow + submit email ─────────────────────────────────────
async function startAuth(email: string): Promise<EaState> {
  let cookies: Record<string, string> = {}

  // 1a. GET accounts.ea.com → redirects to signin.ea.com?execution=Xs1
  const initUrl = `${ACCOUNTS_URL}/connect/auth?mode=junoNff&hide_create=true&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&locale=en_US&release_type=prod`

  let res = await fetch(initUrl, { redirect: 'manual', headers: { 'User-Agent': UA } })
  cookies = mergeCookies(cookies, getSetCookies(res))

  // Follow redirects manually until we reach the login form (200 OK)
  let location = res.headers.get('location') ?? ''
  while (res.status === 302 || res.status === 301) {
    const url = location.startsWith('http') ? location : `${SIGNIN_HOST}${location}`
    res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': UA, Cookie: serializeCookies(cookies) } })
    cookies  = mergeCookies(cookies, getSetCookies(res))
    location = res.headers.get('location') ?? ''
  }

  // Extract execution and selflocation (= full URL with execution param)
  const selfLocation = res.headers.get('selflocation') ?? ''
  const execMatch    = selfLocation.match(/execution=([^&]+)/)
  const initrefMatch = selfLocation.match(/initref=(.+)/)
  if (!execMatch) throw new Error('Could not find execution parameter in EA auth response')

  const execution = execMatch[1]
  const initref   = initrefMatch ? initrefMatch[1] : encodeURIComponent(
    `${ACCOUNTS_URL}:443/connect/auth?mode=junoNff&hide_create=true&response_type=code` +
    `&release_type=prod&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&locale=en_US&client_id=${CLIENT_ID}`
  )

  const loginUrl = `${SIGNIN_HOST}/p/juno/nff/login?execution=${execution}&initref=${initref}`

  // 1b. POST email
  const emailRes = await fetch(loginUrl, {
    method:   'POST',
    redirect: 'manual',
    headers:  { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Cookie: serializeCookies(cookies) },
    body:     `email=${encodeURIComponent(email)}&_eventId=submit&execution=${execution}&initref=${initref}`,
  })
  cookies = mergeCookies(cookies, getSetCookies(emailRes))

  // After email, execution increments from s1 → s2
  const nextLocation = emailRes.headers.get('location') ?? ''
  const nextExec     = nextLocation.match(/execution=([^&]+)/)?.[1] ?? execution.replace(/s\d+$/, 's2')

  return { execution: nextExec, initref, cookies }
}

// ─── Step 2: submit OTP + navigate to auth code ───────────────────────────────
async function verifyCode(code: string, state: EaState): Promise<{ token: string; nucleusId: string }> {
  let { execution, initref, cookies } = state
  const loginBase = `${SIGNIN_HOST}/p/juno/nff/login`

  // 2a. POST OTP code
  const codeUrl = `${loginBase}?execution=${execution}&initref=${initref}`
  let res = await fetch(codeUrl, {
    method:   'POST',
    redirect: 'manual',
    headers:  { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Cookie: serializeCookies(cookies) },
    body:     `oneTimeCode=${encodeURIComponent(code)}&_eventId=submit&execution=${execution}&initref=${initref}`,
  })
  cookies   = mergeCookies(cookies, getSetCookies(res))
  execution = res.headers.get('location')?.match(/execution=([^&]+)/)?.[1] ?? execution

  // 2b. Navigate through remaining optional pages until final redirect with code=
  for (let i = 0; i < 15; i++) {
    const url = `${loginBase}?execution=${execution}&initref=${initref}`

    if (res.status === 302) {
      const loc = res.headers.get('location') ?? ''

      // Final redirect → game store with OAuth code
      if (loc.includes(REDIRECT_URI) || loc.includes('code=')) {
        const fullLoc = loc.startsWith('http') ? loc : `${SIGNIN_HOST}${loc}`
        const oauthCode = new URL(fullLoc).searchParams.get('code')
        if (oauthCode) return exchangeCode(oauthCode, cookies)
        throw new Error('Redirect found but no code parameter')
      }

      // Follow intermediate redirect
      const nextUrl = loc.startsWith('http') ? loc : `${SIGNIN_HOST}${loc}`
      res       = await fetch(nextUrl, { redirect: 'manual', headers: { 'User-Agent': UA, Cookie: serializeCookies(cookies) } })
      cookies   = mergeCookies(cookies, getSetCookies(res))
      execution = res.headers.get('location')?.match(/execution=([^&]+)/)?.[1]
                  ?? res.headers.get('selflocation')?.match(/execution=([^&]+)/)?.[1]
                  ?? execution
      continue
    }

    if (res.status === 200) {
      const html      = await res.text()
      // Pick _eventId: prefer 'cancel' to skip optional steps (PIN, Remember device)
      // Fall back to 'submit' for required steps
      const eventIds  = [...html.matchAll(/name="_eventId"\s+value="([^"]+)"/g)].map(m => m[1])
      const eventId   = eventIds.includes('cancel') ? 'cancel' : 'submit'

      res       = await fetch(url, {
        method:   'POST',
        redirect: 'manual',
        headers:  { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Cookie: serializeCookies(cookies) },
        body:     `_eventId=${eventId}&execution=${execution}&initref=${initref}`,
      })
      cookies   = mergeCookies(cookies, getSetCookies(res))
      execution = res.headers.get('location')?.match(/execution=([^&]+)/)?.[1] ?? execution
      continue
    }

    throw new Error(`Unexpected status ${res.status} at step ${i}`)
  }

  throw new Error('EA auth flow did not complete after 15 steps')
}

// ─── Step 3: exchange OAuth code for access token ─────────────────────────────
async function exchangeCode(oauthCode: string, cookies: Record<string, string>): Promise<{ token: string; nucleusId: string }> {
  const tokenUrl = `${ACCOUNTS_URL}/connect/auth?response_type=token&client_id=ORIGIN_JS_SDK` +
    `&redirect_uri=nucleus%3Arest&prompt=none&release_type=prod`

  const res = await fetch(tokenUrl, {
    redirect: 'manual',
    headers:  { 'User-Agent': UA, Cookie: serializeCookies(cookies) },
  })

  const loc = res.headers.get('location') ?? ''

  // Token is in the fragment: nucleus:rest#access_token=...&...
  const tokenMatch    = loc.match(/access_token=([^&]+)/)
  const nucleusMatch  = loc.match(/pid_id=([^&]+)/)

  if (!tokenMatch) {
    // Fallback: try with the OAuth code directly
    throw new Error(`Token exchange failed. Location: ${loc.slice(0, 200)}`)
  }

  return {
    token:     decodeURIComponent(tokenMatch[1]),
    nucleusId: nucleusMatch ? decodeURIComponent(nucleusMatch[1]) : '',
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, code, state } = req.body as {
    action: 'start' | 'verify'
    email?: string
    code?:  string
    state?: EaState
  }

  try {
    if (action === 'start') {
      if (!email) return res.status(400).json({ error: 'email required' })
      const authState = await startAuth(email)
      return res.status(200).json({ state: authState })
    }

    if (action === 'verify') {
      if (!code || !state) return res.status(400).json({ error: 'code and state required' })
      const result = await verifyCode(code, state)
      return res.status(200).json(result)
    }

    return res.status(400).json({ error: 'action must be start or verify' })
  } catch (err) {
    console.error('EA auth error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Auth failed' })
  }
}
