'use strict'

const express = require('express')
const dcl = require('decentraland-crypto-middleware')
const { createStorage } = require('./storage')
const { applyRace, claimDaily, cleanName, defaultState, equipHorse, purchaseHorse, sanitizeState } = require('./rules')

const PORT = Math.max(1, Number(process.env.PORT) || 8787)
const HOST = process.env.HOST || '0.0.0.0'
const MIN_RACE_WALL_SECONDS = Math.max(5, Number(process.env.MIN_RACE_WALL_SECONDS) || 10)
const MAX_RACE_WALL_SECONDS = Math.max(60, Number(process.env.MAX_RACE_WALL_SECONDS) || 420)
const app = express()
const storage = createStorage()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
app.use(express.json({ limit: '80kb' }))

const authenticate = dcl.express({ expiration: 5 * 60 * 1000, catalyst: process.env.DCL_CATALYST || 'https://peer.decentraland.org' })
const route = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
function wallet(req) { return cleanName(req.auth, 64).toLowerCase() }
function playerName(req, previous) { return cleanName(req.body?.name, 40) || previous?.name || 'RACER' }
async function getOrCreatePlayer(address, name = 'RACER') {
  const existing = await storage.getPlayer(address)
  return existing || storage.createPlayer(address, cleanName(name, 40) || 'RACER', defaultState())
}
function publicState(record) { return { address: record.address, state: sanitizeState(record.state), updatedAt: record.updatedAt || null } }

app.get('/health', (_req, res) => res.json({ ok: true, service: 'hoof-backend', storage: storage.kind, authoritative: true }))

app.get('/v1/state', authenticate, route(async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated identity' })
  const record = await storage.getPlayer(address)
  res.json(record ? publicState(record) : { address, state: null, updatedAt: null })
}))

// One-time import for players who used the local-only build before cloud persistence.
// Existing server records are never overwritten by this compatibility route.
app.put('/v1/state', authenticate, route(async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated identity' })
  const existing = await storage.getPlayer(address)
  if (existing) return res.json({ ok: true, imported: false, ...publicState(existing) })
  const created = await storage.createPlayer(address, playerName(req), sanitizeState(req.body?.state))
  res.status(201).json({ ok: true, imported: true, ...publicState(created) })
}))

app.post('/v1/daily/claim', authenticate, route(async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated identity' })
  const record = await getOrCreatePlayer(address, req.body?.name)
  const result = claimDaily(sanitizeState(record.state))
  const saved = result.claimed ? await storage.savePlayer(address, playerName(req, record), result.state) : record
  res.json({ ok: true, claimed: result.claimed, message: result.message, reward: result.reward || null, ...publicState(saved) })
}))

app.post('/v1/horses/:horseId/purchase', authenticate, route(async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated identity' })
  const record = await getOrCreatePlayer(address, req.body?.name)
  const result = purchaseHorse(sanitizeState(record.state), cleanName(req.params.horseId, 32))
  const saved = result.ok ? await storage.savePlayer(address, playerName(req, record), result.state) : record
  res.status(result.ok ? 200 : 409).json({ ok: result.ok, message: result.message, ...publicState(saved) })
}))

app.post('/v1/horses/:horseId/equip', authenticate, route(async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated identity' })
  const record = await getOrCreatePlayer(address, req.body?.name)
  const result = equipHorse(sanitizeState(record.state), cleanName(req.params.horseId, 32))
  const saved = result.ok ? await storage.savePlayer(address, playerName(req, record), result.state) : record
  res.status(result.ok ? 200 : 409).json({ ok: result.ok, message: result.message, ...publicState(saved) })
}))

app.post('/v1/races/start', authenticate, route(async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated identity' })
  const difficulty = ['EASY', 'NORMAL', 'HARD'].includes(req.body?.difficulty) ? req.body.difficulty : 'NORMAL'
  const seed = Math.max(1, Math.min(4294967295, Math.floor(Number(req.body?.seed) || 1)))
  await getOrCreatePlayer(address, req.body?.name)
  const race = await storage.startRace(address, difficulty, seed)
  res.status(201).json({ ok: true, raceId: race.id, startedAt: race.startedAt })
}))

app.post('/v1/races/:raceId/finish', authenticate, route(async (req, res) => {
  const address = wallet(req)
  if (!address) return res.status(401).json({ ok: false, message: 'Missing authenticated identity' })
  const race = await storage.finishRace(cleanName(req.params.raceId, 64), address)
  if (!race) return res.status(409).json({ ok: false, message: 'Race session is missing, expired or already submitted' })
  const elapsed = (Date.now() - new Date(race.startedAt).getTime()) / 1000
  if (!Number.isFinite(elapsed) || elapsed < MIN_RACE_WALL_SECONDS || elapsed > MAX_RACE_WALL_SECONDS) return res.status(422).json({ ok: false, message: 'Race session duration is invalid' })
  const record = await getOrCreatePlayer(address, req.body?.name)
  const result = applyRace(sanitizeState(record.state), { ...req.body, difficulty: race.difficulty })
  const saved = await storage.savePlayer(address, playerName(req, record), result.state)
  res.json({ ok: true, completedTasks: result.completed, reward: result.reward, message: result.message, ...publicState(saved) })
}))

app.get('/v1/leaderboard', authenticate, route(async (_req, res) => {
  const entries = (await storage.leaderboard(100)).map((entry, index) => ({ rank: index + 1, address: entry.address, name: entry.name || 'RACER', points: entry.points }))
  res.json({ entries })
}))

app.use((error, _req, res, _next) => {
  console.error('[HOOF] Request failed:', error)
  res.status(error.statusCode || 500).json({ ok: false, message: error.statusCode ? error.message : 'Internal error' })
})

async function shutdown() { await storage.close(); process.exit(0) }
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

storage.init().then(() => app.listen(PORT, HOST, () => console.log(`[HOOF] Backend listening on http://${HOST}:${PORT} with ${storage.kind} storage`))).catch(error => { console.error('[HOOF] Backend failed to start:', error); process.exit(1) })
