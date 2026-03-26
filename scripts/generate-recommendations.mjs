/**
 * Génère public/recommendations.json en analysant les mods
 * des top joueurs Kyber GAC via Comlink.
 *
 * Usage: node scripts/generate-recommendations.mjs
 *
 * Le script :
 *  1. Récupère le leaderboard GAC Kyber (top 200 joueurs)
 *  2. Pour chaque joueur, charge son roster + mods
 *  3. Agrège quels sets / primaries sont utilisés par perso
 *  4. Génère recommendations.json
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMLINK   = 'https://swgoh-comlink-latest-wuy6.onrender.com'
const OUT_FILE  = resolve(__dirname, '../public/recommendations.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function post(endpoint, body) {
  const res = await fetch(`${COMLINK}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${endpoint} → ${res.status} ${await res.text()}`)
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const TIER_LETTER = { A:1, B:2, C:3, D:4, E:5, F:6 }
function parseDef(defId) {
  return {
    set:    parseInt(defId[0], 10),
    rarity: TIER_LETTER[defId[1]] ?? 5,
    slot:   parseInt(defId[2], 10),
  }
}

// ─── Aggregation ──────────────────────────────────────────────────────────────
// perCharacter[base_id] = { sets: {1:0,...}, primaries: {2:{statId:0},...}, speedSum, count }
const perCharacter = {}

function ensure(baseId) {
  if (!perCharacter[baseId]) {
    perCharacter[baseId] = {
      sets:      {},   // set → count
      primaries: { 2: {}, 3: {}, 4: {}, 5: {}, 6: {} },
      speedSum:  0,
      modCount:  0,
      count:     0,    // number of players sampled
    }
  }
  return perCharacter[baseId]
}

function processUnit(unit) {
  const baseId = ((unit.definitionId ?? '').split(':')[0]) || ''
  if (!baseId || unit.combatType !== 1) return

  const mods = unit.equippedStatMod ?? []
  if (mods.length === 0) return

  const entry = ensure(baseId)
  entry.count++

  let speed = 0
  for (const mod of mods) {
    const { set, slot } = parseDef(mod.definitionId ?? '')
    if (!set || !slot) continue

    // Count set usage
    entry.sets[set] = (entry.sets[set] ?? 0) + 1

    // Count primary stat usage for slots 2-6
    if (slot >= 2) {
      const statId = mod.primaryStat?.stat?.unitStatId
      if (statId) {
        entry.primaries[slot] = entry.primaries[slot] ?? {}
        entry.primaries[slot][statId] = (entry.primaries[slot][statId] ?? 0) + 1
      }
    }

    // Sum speed from secondaries
    for (const sec of mod.secondaryStat ?? []) {
      if (sec.stat?.unitStatId === 5) speed += sec.value
    }
  }
  entry.speedSum += speed
  entry.modCount++
}

// ─── Build recommendation from aggregation ────────────────────────────────────
const STAT_NAMES = {
  5: 'Speed', 17: 'Crit Damage %', 18: 'Potency %', 19: 'Tenacity %',
  41: 'Offense %', 42: 'Defense %', 53: 'Crit Chance %', 54: 'Crit Avoidance %',
  55: 'Health %', 56: 'Protection %', 48: 'Offense', 49: 'Defense',
}

function buildReco(baseId, data) {
  const totalMods = data.modCount || 1

  const sets = Object.entries(data.sets)
    .map(([set, cnt]) => ({ set: Number(set), usage_pct: Math.round((cnt / totalMods) * 100) }))
    .sort((a, b) => b.usage_pct - a.usage_pct)
    .slice(0, 4)

  const primaries = {}
  for (const [slot, stats] of Object.entries(data.primaries)) {
    const total = Object.values(stats).reduce((s, n) => s + n, 0) || 1
    primaries[Number(slot)] = Object.entries(stats)
      .map(([statId, cnt]) => ({
        stat_id:   Number(statId),
        name:      STAT_NAMES[Number(statId)] ?? `Stat ${statId}`,
        usage_pct: Math.round((cnt / total) * 100),
      }))
      .sort((a, b) => b.usage_pct - a.usage_pct)
      .slice(0, 3)
  }

  return {
    sets,
    primaries,
    avg_speed:     data.count > 0 ? Math.round(data.speedSum / data.count) : 0,
    sample_size:   data.count,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('🔍 Connexion à Comlink…')

// 1. Récupérer le leaderboard GAC
let leaderboardIds = []
try {
  console.log('📋 Chargement leaderboard GAC Kyber…')
  const lb = await post('/getLeaderboard', {
    payload: {
      leaderboardType: 4,    // Grand Arena
      eventInstanceId: '',   // latest
      groupId: '',
      league:  40,           // 40 = Kyber
      division: 5,           // top division
    }
  })
  leaderboardIds = (lb.player ?? lb.leaderboard ?? [])
    .slice(0, 100)
    .map(p => p.playerId ?? p.id)
    .filter(Boolean)
  console.log(`✅ ${leaderboardIds.length} joueurs Kyber trouvés`)
} catch (e) {
  console.warn('⚠️  Leaderboard indisponible:', e.message)
  console.log('📌 Passage en mode manuel — entre des ally codes un par un')
  // Fallback: quelques ally codes connus de top joueurs (à compléter)
  leaderboardIds = []
}

// 2. Charger chaque joueur et agréger
let processed = 0
const BATCH = 5
const DELAY  = 500 // ms between batches

for (let i = 0; i < leaderboardIds.length; i += BATCH) {
  const batch = leaderboardIds.slice(i, i + BATCH)
  await Promise.all(batch.map(async (playerId) => {
    try {
      const player = await post('/player', { payload: { playerId }, enums: false })
      for (const unit of player.rosterUnit ?? []) processUnit(unit)
      processed++
      process.stdout.write(`\r  Traitement: ${processed}/${leaderboardIds.length} joueurs`)
    } catch {
      // ignore individual player errors
    }
  }))
  if (i + BATCH < leaderboardIds.length) await sleep(DELAY)
}

console.log(`\n✅ ${processed} joueurs traités`)
console.log(`📊 ${Object.keys(perCharacter).length} personnages avec données`)

// 3. Construire le JSON final
const characters = {}
for (const [baseId, data] of Object.entries(perCharacter)) {
  if (data.count >= 3) { // au moins 3 joueurs pour avoir une stat fiable
    characters[baseId] = buildReco(baseId, data)
  }
}

const output = {
  version:        new Date().toISOString().slice(0, 10),
  generated_from: 'Comlink GAC Kyber top 100',
  sample_players: processed,
  characters,
}

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2))
console.log(`\n💾 Sauvegardé: ${OUT_FILE}`)
console.log(`   ${Object.keys(characters).length} personnages avec recommandations`)
