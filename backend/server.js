'use strict'

const express = require('express')
const dcl = require('decentraland-crypto-middleware')
const fs = require('node:fs/promises')
const path = require('node:path')
const PORT = Math.max(1, Number(process.env.PORT) || 8787)
const HOST = process.env.HOST || '0.0.0.0'
const DATA_FILE = path.resolve(process.env.HOOF_DATA_FILE || path.join(__dirname, 'data', 'players.json'))
const app = express()
let database = { players: {} }
let writeQueue = Promise.resolve()

app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
app.use(express.json({ limit: '80kb' }))

const authenticate = dcl.express({
  expiration: 5 * 60 * 1000,
  catalyst: process.env.DCL_CATALYST || 'https://peer.decentraland.org'
})

function cleanString(value, max = 48) {
  return typeof value === 'string' ? value.replace(/[<>]/g, '').trim().slice(0, max) : ''
}
function cleanInteger(value, max) { return Math.max(0, Math.min(max, Math.floor(Number(value) || 0))) }

function sanitizeState(value) {
  const economy = value && typeof value.economy === 'object' ? value.economy : {}
  const daily = value && typeof value.daily === 'object' ? value.daily : {}
  const allowedHorses = new Set(['ember', 'moonlight', 'nightfall', 'sunfire'])
  const owned = Array.isArray(economy.ownedHorses) ? [...new Set(economy.ownedHorses.filter(id => allowedHorses.has(id)))] : ['ember']
  if (!owned.includes('ember')) owned.unshift('ember')
  const progress = {}, claimed = {}
  if (daily.progress && typeof daily.progress === 'object') {
    for (const [key, amount] of Object.entries(daily.progress).slice(0, 100)) progress[cleanString(key, 64)] = cleanInteger(amount, 1000)
  }
  if (daily.claimed && typeof daily.claimed === 'object') {
    for (const [key, complete] of Object.entries(daily.claimed).slice(0, 100)) if (complete) claimed[cleanString(key, 64)] = true
  }
  return {
    economy: {
      horseshoes: cleanInteger(economy.horseshoes, 1000000), stableXp: cleanInteger(economy.stableXp, 10000000),
      ownedHorses: owned, equippedHorse: owned.includes(economy.equippedHorse) ? economy.equippedHorse : 'ember',
      calendarDay: cleanInteger(economy.calendarDay, 27), calendarCycle: Math.max(1, cleanInteger(economy.calendarCycle, 100000)),
      lastClaimDate: /^\d{4}-\d{2}-\d{2}$/.test(economy.lastClaimDate || '') ? economy.lastClaimDate : ''
    },
    daily: {
      dateKey: /^\d{4}-\d{2}-\d{2}$/.test(daily.dateKey || '') ? daily.dateKey : new Date().toISOString().slice(0, 10),
      progress, claimed, leaderboardPoints: cleanInteger(daily.leaderboardPoints, 100000000)
    }
  }
}

async function loadDatabase() {
  try {
    const parsed = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'))
    if (parsed && typeof parsed.players === 'object') database = parsed
  } catch (error) { if (error.code !== 'ENOENT') console.error('[HOOF] Failed to read database:', error) }
}
function persistDatabase() {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    const temporary = `${DATA_FILE}.tmp`
    await fs.writeFile(temporary, JSON.stringify(database, null, 2), 'utf8')
    await fs.rename(temporary, DATA_FILE)
  }).catch(error => console.error('[HOOF] Failed to save database:', error))
  return writeQueue
}
function wallet(req) { return cleanString(req.auth, 64).toLowerCase() }

app.get('/health', (_req, res) => res.json({ ok: true, service: 'hoof-backend' }))
app.get('/v1/state', authenticate, (req, res) => {
  const address = wallet(req), record = database.players[address]
  res.json({ address, state: record ? record.state : null, updatedAt: record?.updatedAt || null })
})
app.put('/v1/state', authenticate, async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated wallet' })
  const previous = database.players[address]
  database.players[address] = {
    name: cleanString(req.body?.name, 40) || previous?.name || 'RACER', state: sanitizeState(req.body?.state), updatedAt: new Date().toISOString()
  }
  await persistDatabase()
  res.json({ ok: true, address, updatedAt: database.players[address].updatedAt })
})
app.get('/v1/leaderboard', authenticate, (_req, res) => {
  const entries = Object.entries(database.players).map(([address, record]) => ({
    address, name: record.name || 'RACER', points: cleanInteger(record.state?.daily?.leaderboardPoints, 100000000)
  })).sort((a, b) => b.points - a.points || a.address.localeCompare(b.address)).slice(0, 100)
    .map((entry, index) => ({ rank: index + 1, ...entry }))
  res.json({ entries })
})
app.use((error, _req, res, _next) => {
  console.error('[HOOF] Request failed:', error)
  res.status(error.statusCode || 500).json({ ok: false, message: error.statusCode ? error.message : 'Internal error' })
})
loadDatabase().then(() => app.listen(PORT, HOST, () => console.log(`[HOOF] Backend listening on http://${HOST}:${PORT}`)))
