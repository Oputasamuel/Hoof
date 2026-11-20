'use strict'

const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

function createStorage(options = {}) {
  const databaseUrl = options.databaseUrl || process.env.DATABASE_URL
  return databaseUrl ? createPostgresStorage(databaseUrl) : createJsonStorage(options.dataFile)
}

function createPostgresStorage(connectionString) {
  const { Pool } = require('pg')
  const ssl = process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === 'true' }
  const pool = new Pool({ connectionString, ssl, max: Math.max(2, Number(process.env.PG_POOL_SIZE) || 10), idleTimeoutMillis: 30000 })
  return {
    kind: 'postgres',
    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS hoof_players (
          address TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          state JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS hoof_races (
          id TEXT PRIMARY KEY,
          address TEXT NOT NULL REFERENCES hoof_players(address) ON DELETE CASCADE,
          difficulty TEXT NOT NULL,
          seed BIGINT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          finished_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS hoof_players_points_idx ON hoof_players (((state->'daily'->>'leaderboardPoints')::BIGINT) DESC);
        CREATE INDEX IF NOT EXISTS hoof_races_address_status_idx ON hoof_races (address, status);
      `)
    },
    async getPlayer(address) {
      const result = await pool.query('SELECT address, name, state, updated_at AS "updatedAt" FROM hoof_players WHERE address=$1', [address])
      return result.rows[0] || null
    },
    async createPlayer(address, name, state) {
      const result = await pool.query('INSERT INTO hoof_players(address,name,state) VALUES($1,$2,$3::jsonb) ON CONFLICT(address) DO NOTHING RETURNING address,name,state,updated_at AS "updatedAt"', [address, name, JSON.stringify(state)])
      return result.rows[0] || this.getPlayer(address)
    },
    async savePlayer(address, name, state) {
      const result = await pool.query('INSERT INTO hoof_players(address,name,state) VALUES($1,$2,$3::jsonb) ON CONFLICT(address) DO UPDATE SET name=EXCLUDED.name,state=EXCLUDED.state,updated_at=NOW() RETURNING address,name,state,updated_at AS "updatedAt"', [address, name, JSON.stringify(state)])
      return result.rows[0]
    },
    async leaderboard(limit) {
      const result = await pool.query(`SELECT address,name,COALESCE((state->'daily'->>'leaderboardPoints')::BIGINT,0) AS points FROM hoof_players ORDER BY points DESC,address ASC LIMIT $1`, [limit])
      return result.rows.map(row => ({ ...row, points: Number(row.points) }))
    },
    async startRace(address, difficulty, seed) {
      const id = randomUUID()
      await pool.query("UPDATE hoof_races SET status='expired' WHERE address=$1 AND status='active'", [address])
      const result = await pool.query('INSERT INTO hoof_races(id,address,difficulty,seed) VALUES($1,$2,$3,$4) RETURNING id,address,difficulty,seed,started_at AS "startedAt"', [id, address, difficulty, seed])
      return result.rows[0]
    },
    async finishRace(id, address) {
      const result = await pool.query("UPDATE hoof_races SET status='finished',finished_at=NOW() WHERE id=$1 AND address=$2 AND status='active' RETURNING id,address,difficulty,seed,started_at AS \"startedAt\",finished_at AS \"finishedAt\"", [id, address])
      return result.rows[0] || null
    },
    async close() { await pool.end() }
  }
}

function createJsonStorage(dataFile) {
  const file = path.resolve(dataFile || process.env.HOOF_DATA_FILE || path.join(__dirname, 'data', 'players.json'))
  let database = { players: {}, races: {} }
  let writeQueue = Promise.resolve()
  async function persist() {
    writeQueue = writeQueue.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true })
      const temporary = `${file}.tmp`
      await fs.writeFile(temporary, JSON.stringify(database, null, 2), 'utf8')
      await fs.rename(temporary, file)
    })
    return writeQueue
  }
  return {
    kind: 'json',
    async init() {
      try {
        const parsed = JSON.parse(await fs.readFile(file, 'utf8'))
        if (parsed && typeof parsed.players === 'object') database = { players: parsed.players, races: parsed.races && typeof parsed.races === 'object' ? parsed.races : {} }
      } catch (error) { if (error.code !== 'ENOENT') throw error }
    },
    async getPlayer(address) { return database.players[address] || null },
    async createPlayer(address, name, state) {
      if (!database.players[address]) { database.players[address] = { address, name, state, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; await persist() }
      return database.players[address]
    },
    async savePlayer(address, name, state) {
      const previous = database.players[address]
      database.players[address] = { address, name, state, createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }
      await persist()
      return database.players[address]
    },
    async leaderboard(limit) {
      return Object.values(database.players).map(record => ({ address: record.address, name: record.name, points: Number(record.state?.daily?.leaderboardPoints) || 0 })).sort((a, b) => b.points - a.points || a.address.localeCompare(b.address)).slice(0, limit)
    },
    async startRace(address, difficulty, seed) {
      for (const race of Object.values(database.races)) if (race.address === address && race.status === 'active') race.status = 'expired'
      const id = randomUUID(), race = { id, address, difficulty, seed, status: 'active', startedAt: new Date().toISOString() }
      database.races[id] = race
      await persist()
      return race
    },
    async finishRace(id, address) {
      const race = database.races[id]
      if (!race || race.address !== address || race.status !== 'active') return null
      race.status = 'finished'; race.finishedAt = new Date().toISOString(); await persist(); return race
    },
    async close() {}
  }
}

module.exports = { createStorage }
