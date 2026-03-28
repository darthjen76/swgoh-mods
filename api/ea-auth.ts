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

function log(tag: string, ...args: unknown[]) {
  const line = `[${new Date().toISOString()}] [${tag}] ${args.map(a =>
    typeof a === 'string' ? a : JSON.stringify(a, null, 0)
  ).join(' ')}`
  console.log(line)
}

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
  log('ea-auth', `start: execution=${execution}`)

  // Submit email
  const loginUrl = `${SIGNIN_HOST}/p/juno/nff/login?execution=${execution}&initref=${initref}`
  const emailRes = await post(loginUrl, cookies, `email=${encodeURIComponent(email)}&_eventId=submit&execution=${execution}&initref=${initref}`)
  cookies = merge(cookies, emailRes)

  const loc      = emailRes.headers.get('location') ?? ''
  const nextExec = extractExecution(loc) ?? execution.replace(/s\d+$/, 's2')
  log('ea-auth', `email submitted → ${emailRes.status} next=${nextExec}`)

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

  // 2a. GET the OTP page first to refresh session cookies before submitting
  const pageRes = await get(signinUrl(), cookies)
  cookies = merge(cookies, pageRes)
  const sl0 = pageRes.headers.get('selflocation') ?? ''
  if (sl0) { const e = extractExecution(sl0); if (e) execution = e }
  debug.push(`OTP page GET → ${pageRes.status}`)
  log('ea-auth', `OTP page GET → ${pageRes.status}`)

  // 2b. POST OTP
  let res = await post(signinUrl(), cookies,
    `oneTimeCode=${encodeURIComponent(otpCode)}&_eventId=submit&execution=${execution}&initref=${initref}`)
  cookies = merge(cookies, res)
  debug.push(`OTP POST → ${res.status}`)

  log('ea-auth', `OTP submitted → ${res.status}`)

  // 2b. Navigate until we get the OAuth code redirect
  for (let i = 0; i < 25; i++) {
    const status = res.status
    const loc    = res.headers.get('location') ?? ''
    const msg    = `[${i}] status=${status} loc=${loc.slice(0, 100)}`
    debug.push(msg)
    log('ea-auth', msg)

    if (status === 302 || status === 301) {
      const fullLoc = loc.startsWith('http') ? loc : `${SIGNIN_HOST}${loc}`

      // OAuth success — code in URL
      if (loc.includes('code=')) {
        const oauthCode = new URL(fullLoc).searchParams.get('code')
        if (oauthCode) {
          debug.push('OAuth code obtained, exchanging for token…')
          const result = await exchangeCode(oauthCode, cookies)
          return { ...result, debug }
        }
      }

      // ACCESS_DENIED at REDIRECT_URI — stop immediately
      if (loc.includes(REDIRECT_URI) && loc.includes('error=')) {
        const errCode = new URL(fullLoc).searchParams.get('error_code') ?? 'unknown'
        throw new Error(`EA OAuth access denied (code ${errCode}). The EA account may not have access to SWGOH_SERVER_WEB_APP. Debug: ${debug.join(' | ')}`)
      }

      // Follow redirect and update execution from new URL
      const execInUrl = extractExecution(fullLoc)
      if (execInUrl) execution = execInUrl

      res     = await get(fullLoc, cookies)
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

      // Detect all _eventId values in the page (handle both attribute orders)
      const eventIds = [
        ...[...html.matchAll(/name=["']_eventId["'][^>]*value=["']([^"']+)["']/g)].map(m => m[1]),
        ...[...html.matchAll(/value=["']([^"']+)["'][^>]*name=["']_eventId["']/g)].map(m => m[1]),
      ]
      const pageTitle = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '?'
      // Log 800 chars of HTML body for debugging
      const bodySnip  = (html.match(/<body[^>]*>([\s\S]*)/i)?.[1] ?? html).replace(/\s+/g, ' ').slice(0, 800)
      const msg2 = `  200 title="${pageTitle}" exec=${execution} eventIds=[${eventIds.join(',')}] body="${bodySnip}"`
      debug.push(msg2)
      log('ea-auth', msg2)

      // Detect <meta http-equiv="refresh"> — follow it via GET instead of POST
      const metaRefresh = html.match(/http-equiv=["']refresh["'][^>]*content=["'][^"']*url=['"]?([^"'\s>]+)/i)?.[1]
                       ?? html.match(/content=["'][^"']*url=['"]?([^"'\s>]+)[^>]*http-equiv=["']refresh["']/i)?.[1]
      if (metaRefresh && eventIds.length === 0) {
        const refreshUrl = metaRefresh.startsWith('http') ? metaRefresh : `${SIGNIN_HOST}${metaRefresh}`
        debug.push(`  meta-refresh → GET ${refreshUrl.slice(0, 120)}`)
        log('ea-auth', `meta-refresh → GET ${refreshUrl.slice(0, 120)}`)
        res     = await get(refreshUrl, cookies)
        cookies = merge(cookies, res)
        continue
      }

      // Detect JavaScript redirect (location.replace/href) when no eventIds and no meta-refresh
      if (eventIds.length === 0) {
        const jsRedirect = html.match(/location\.replace\(["']([^"']+)["']\)/)?.[1]
                        ?? html.match(/location\.href\s*=\s*["']([^"']+)["']/)?.[1]
        if (jsRedirect) {
          const jsUrl = jsRedirect.startsWith('http') ? jsRedirect : `${SIGNIN_HOST}${jsRedirect}`
          debug.push(`  js-redirect → GET ${jsUrl.slice(0, 120)}`)
          log('ea-auth', `js-redirect → GET ${jsUrl.slice(0, 120)}`)
          res     = await get(jsUrl, cookies)
          cookies = merge(cookies, res)
          continue
        }
      }

      // If we're back on the email entry page (s1), session was invalidated — stop
      if (execution.endsWith('s1') && (pageTitle.toUpperCase().includes('SIGN IN') || html.includes('type="email"'))) {
        throw new Error(`EA session invalidated — restarted at email step after step ${i}. OTP may have expired or been invalid. Debug: ${debug.join(' | ')}`)
      }

      // Check for error page with no way forward
      if (html.includes('Something went wrong') && eventIds.length === 0) {
        throw new Error(`EA returned an error page at step ${i}. Debug: ${debug.join(' | ')}`)
      }

      // Skip optional pages — prefer cancel to skip, then any non-back event, back as last resort
      const forwardEvent = eventIds.filter(e => e !== 'cancel' && e !== 'back')[0]
      const eventId = eventIds.includes('cancel') ? 'cancel'
                    : forwardEvent                 ? forwardEvent
                    : eventIds.includes('submit')  ? 'submit'
                    : eventIds[0]                  ?? 'submit'

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
  log('ea-auth', `exchangeCode: oauthCode=${oauthCode.slice(0, 20)}…`)

  // Approach A: authorization_code grant (public client, no secret)
  const tokenRes = await fetch(`${ACCOUNTS_URL}/connect/token`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':   UA,
      Cookie:         serialize(cookies),
    },
    body: `grant_type=authorization_code&code=${encodeURIComponent(oauthCode)}` +
          `&client_id=SWGOH_SERVER_WEB_APP&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
  })
  log('ea-auth', `connect/token → ${tokenRes.status}`)

  if (tokenRes.ok) {
    const json = await tokenRes.json() as Record<string, unknown>
    log('ea-auth', `connect/token json keys: ${Object.keys(json).join(', ')}`)
    const token = json['access_token'] as string | undefined
    if (token) {
      return { token, nucleusId: (json['pid_id'] as string) ?? '' }
    }
  }

  const tokenBody = await tokenRes.text().catch(() => '')
  log('ea-auth', `connect/token body: ${tokenBody.slice(0, 200)}`)

  // Approach B: ORIGIN_JS_SDK implicit grant — returns JSON body (not a redirect)
  const implicitUrl = `${ACCOUNTS_URL}/connect/auth?response_type=token&client_id=ORIGIN_JS_SDK` +
    `&redirect_uri=nucleus%3Arest&prompt=none&release_type=prod`

  const res    = await fetch(implicitUrl, { redirect: 'manual', headers: headers(cookies) })
  const status = res.status
  const loc    = res.headers.get('location') ?? ''
  const body   = await res.text().catch(() => '')
  log('ea-auth', `ORIGIN_JS_SDK → status=${status} loc=${loc.slice(0, 100)} body=${body.slice(0, 200)}`)

  // Token may be in Location header (redirect) or body (JSON)
  const fromLoc  = loc.match(/access_token=([^&#]+)/)?.[1]
  const fromBody = (() => { try { return (JSON.parse(body) as Record<string,string>)['access_token'] } catch { return null } })()
  const token    = fromLoc ? decodeURIComponent(fromLoc) : fromBody

  if (token) {
    const nucleusFromLoc  = loc.match(/pid_id=([^&#]+)/)?.[1]
    const nucleusFromBody = (() => { try { return (JSON.parse(body) as Record<string,string>)['pid_id'] } catch { return null } })()
    return {
      token,
      nucleusId: nucleusFromLoc ? decodeURIComponent(nucleusFromLoc) : (nucleusFromBody ?? ''),
    }
  }

  throw new Error(`Token exchange failed. connect/token=${tokenRes.status} | ORIGIN_JS_SDK status=${status} loc="${loc.slice(0,100)}" body="${body.slice(0,200)}"`)
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
    log('ea-auth', 'ERROR', err instanceof Error ? err.message : err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Auth failed' })
  }
}
