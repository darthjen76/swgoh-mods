import { appendFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const LOG_FILE = resolve(process.cwd(), 'logs', 'api.log')

try { mkdirSync(resolve(process.cwd(), 'logs'), { recursive: true }) } catch {}

export function log(tag: string, ...args: unknown[]) {
  const line = `[${new Date().toISOString()}] [${tag}] ${args.map(a =>
    typeof a === 'string' ? a : JSON.stringify(a, null, 0)
  ).join(' ')}\n`
  process.stdout.write(line)
  try { appendFileSync(LOG_FILE, line) } catch {}
}
