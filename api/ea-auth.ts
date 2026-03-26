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
const UA           = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'

// ─── Cookie helpers ───────────────────────────────────────────────────────────
function parseCookies(headers: string[]): Record<string, string> {
  const jar: Record<string, string> = {}
  for (const h of headers) {
    const part = h.split(';')[0]
    const idx  = part.indexOf('=')
    if (idx > 0) jar[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return jar
}

function serialize(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

function merge(jar: Record<string, string>, res: Response): Record<string, string> {
  // @ts-expect-error - getSetCookie() not in all TS typings
  const raw: string[] = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/).filter(Boolean)
  return { ...jar, ...parseCookies(raw) }
}

function headers(cookies: Record<string, string>, extra: Record<string, string> = {}) {
  return { 'User-Agent': UA, Cookie: serialize(cookies), ...extra }
}

// ─── EA auth state ─────────────────────────────────────────────────────────────
export interface EaState {
  execution: string
  initref:   string
  cookies:   Record<string, string>
}

// ─── Extract execution from URL or header ─────────────────────────────────────
function extractExecution(s: string): string | null {
  return s.match(/execution=([^&\s"']+)/)?.[1] ?? null
}

// ─── Fetch with redirect:manual helper ───────────────────────────────────────
async function get(url: string, cookies: Record<string, string>): Promise<Response> {
  return fetch(url, { redirect: 'manual', headers: headers(cookies) })
}

async function post(url: string, cookies: Record<string, string>, body: string): Promise<Response> {
  return fetch(url, {
    method:   'POST',
    redirect: 'manual',
    headers:  headers(cookies, { 'Content-Type': 'application/x-www-form-urlencoded' }),
    body,
  })
}

// ─── Step 1: initiate flow + submit email ─────────────────────────────────────
async function startAuth(email: string): Promise<EaState> {
  let cookies: Record<string, string> = {}

  const initUrl = `${ACCOUNTS_URL}/connect/auth?mode=junoNff&hide_create=true&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&locale=en_US&release_type=prod`

  // Follow redirects until we reach the 200 login form
  let res = await get(initUrl, cookies)
  cookies = merge(cookies, res)

  for (let i = 0; i < 10 && (res.status === 301 || res.status === 302); i++) {
    const loc = res.headers.get('location') ?? ''
    const url = loc.startsWith('http') ? loc : `${SIGNIN_HOST}${loc}`
    res     = await get(url, cookies)
    cookies = merge(cookies, res)
  }

  const selfLoc  = res.headers.get('selflocation') ?? ''
  const execution = extractExecution(selfLoc)
  if (!execution) throw new Error('Could not find execution in EA auth init')

  const initref = selfLoc.match(/initref=(.+)/)?.[1] ?? ''

  // Submit email
  const loginUrl = `${SIGNIN_HOST}/p/juno/nff/login?execution=${execution}&initref=${initref}`
  const emailRes = await post(loginUrl, cookies, `email=${encodeURIComponent(email)}&_eventId=submit&execution=${execution}&initref=${initref}`)
  cookies = merge(cookies, emailRes)

  const loc      = emailRes.headers.get('location') ?? ''
  const nextExec = extractExecution(loc) ?? execution.replace(/s\d+$/, 's2')

  return { execution: nextExec, initref, cookies }
}

// ─── Step 2: submit OTP + navigate all intermediate pages to get auth code ────
async function verifyCode(
  otpCode: string,
  state: EaState,
): Promise<{ token: string; nucleusId: string; debug: string[] }> {
  let { execution, initref, cookies } = state
  const debug: string[] = []

  const signinUrl = () => `${SIGNIN_HOST}/p/juno/nff/login?execution=${execution}&initref=${initref}`

  // 2a. POST OTP
  let res = await post(signinUrl(), cookies,
    `oneTimeCode=${encodeURIComponent(otpCode)}&_eventId=submit&execution=${execution}&initref=${initref}`)
  cookies = merge(cookies, res)
  debug.push(`OTP POST → ${res.status}`)

  // 2b. Navigate until we get the OAuth code redirect
  for (let i = 0; i < 25; i++) {
    const status = res.status
    const loc    = res.headers.get('location') ?? ''
    debug.push(`[${i}] status=${status} location=${loc.slice(0, 120)}`)

    if (status === 302 || status === 301) {
      // Check for final code redirect
      if (loc.includes('code=') || (loc.includes(REDIRECT_URI) && loc.includes('?'))) {
        const fullLoc  = loc.startsWith('http') ? loc : `${SIGNIN_HOST}${loc}`
        const oauthCode = new URL(fullLoc).searchParams.get('code')
        if (oauthCode) {
          debug.push('OAuth code obtained, exchanging for token…')
          const result = await exchangeCode(oauthCode, cookies)
          return { ...result, debug }
        }
      }

      // Follow redirect and update execution from new URL
      const nextUrl  = loc.startsWith('http') ? loc : `${SIGNIN_HOST}${loc}`
      const execInUrl = extractExecution(nextUrl)
      if (execInUrl) execution = execInUrl

      res     = await get(nextUrl, cookies)
      cookies = merge(cookies, res)

      // Also try to get execution from selflocation
      const sl = res.headers.get('selflocation') ?? ''
      if (sl) { const e = extractExecution(sl); if (e) execution = e }
      continue
    }

    if (status === 200) {
      const html      = await res.text()
      const selfLoc   = res.headers.get('selflocation') ?? ''

      // Update execution from selflocation of this page
      const execSelf = extractExecution(selfLoc)
      if (execSelf) execution = execSelf

      // Check for error page (no way forward)
      if (html.includes('Something went wrong')) {
        throw new Error(`EA returned an error page at step ${i}. Debug: ${debug.join(' | ')}`)
      }

      // Detect all _eventId values in the page (handle both attribute orders)
      const eventIds = [
        ...[...html.matchAll(/name=["']_eventId["'][^>]*value=["']([^"']+)["']/g)].map(m => m[1]),
        ...[...html.matchAll(/value=["']([^"']+)["'][^>]*name=["']_eventId["']/g)].map(m => m[1]),
      ]
      debug.push(`  page eventIds: [${eventIds.join(', ')}]`)

      // Skip optional pages (PIN setup, remember device, etc.)
      // Prefer: cancel > back > submit
      const eventId = eventIds.includes('cancel') ? 'cancel'
                    : eventIds.includes('back')   ? 'back'
                    : 'submit'

      debug.push(`  → POST _eventId=${eventId}`)
      res     = await post(signinUrl(), cookies, `_eventId=${eventId}&execution=${execution}&initref=${initref}`)
      cookies = merge(cookies, res)
      continue
    }

    throw new Error(`Unexpected HTTP ${status} at step ${i}. Debug: ${debug.join(' | ')}`)
  }

  throw new Error(`EA auth flow did not complete after 25 steps. Debug: ${debug.join(' | ')}`)
}

// ─── Step 3: exchange OAuth code for access token ─────────────────────────────
async function exchangeCode(
  oauthCode: string,
  cookies: Record<string, string>,
): Promise<{ token: string; nucleusId: string }> {
  const tokenUrl = `${ACCOUNTS_URL}/connect/auth?response_type=token&client_id=ORIGIN_JS_SDK` +
    `&redirect_uri=nucleus%3Arest&prompt=none&release_type=prod`

  const res = await get(tokenUrl, cookies)
  const loc = res.headers.get('location') ?? ''

  const tokenMatch   = loc.match(/access_token=([^&]+)/)
  const nucleusMatch = loc.match(/pid_id=([^&]+)/)

  if (!tokenMatch) {
    throw new Error(`Token exchange failed. Location: ${loc.slice(0, 300)}`)
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
