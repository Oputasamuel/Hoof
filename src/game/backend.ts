import { engine, executeTask } from '@dcl/sdk/ecs'
import { signedFetch } from '~system/SignedFetch'
import { getPlayer } from '@dcl/sdk/players'
import { exportEconomyState, hydrateEconomyState } from './economy'
import { exportDailyState, hydrateDailyState } from './dailyTasks'

// Local preview endpoint. Change this to the deployed HTTPS backend before publishing.
export const HOOF_BACKEND_URL = 'http://127.0.0.1:8787'

type CloudState = {
  economy: ReturnType<typeof exportEconomyState>
  daily: ReturnType<typeof exportDailyState>
}

export type LeaderboardEntry = { rank: number; address: string; name: string; points: number }

let status: 'CONNECTING' | 'CLOUD' | 'LOCAL' = 'CONNECTING'
let initialized = false
let hydrated = false
let requestActive = false
let saveTimer = 0
let leaderboardTimer = 0
let lastSaved = ''
let leaderboard: LeaderboardEntry[] = []

function snapshot(): CloudState {
  return { economy: exportEconomyState(), daily: exportDailyState() }
}

async function signedRequest(path: string, method = 'GET', body?: unknown) {
  const response = await signedFetch({
    url: `${HOOF_BACKEND_URL}${path}`,
    init: {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    }
  })
  if (!response.ok) throw new Error(`HOOF backend returned ${response.status}`)
  return response.body ? JSON.parse(response.body) : {}
}

async function loadCloudState() {
  if (requestActive) return
  requestActive = true
  try {
    const result = await signedRequest('/v1/state') as { state?: CloudState | null }
    if (result.state) {
      hydrateEconomyState(result.state.economy)
      hydrateDailyState(result.state.daily)
    } else {
      await signedRequest('/v1/state', 'PUT', { state: snapshot(), name: getPlayer()?.name || 'RACER' })
    }
    lastSaved = JSON.stringify(snapshot())
    hydrated = true
    status = 'CLOUD'
  } catch (error) {
    console.log('[HOOF] Cloud save unavailable; using local cache', error)
    hydrated = true
    status = 'LOCAL'
  } finally {
    requestActive = false
  }
}

async function saveCloudState() {
  if (requestActive || !hydrated) return
  const state = snapshot()
  const serialized = JSON.stringify(state)
  if (serialized === lastSaved) return
  requestActive = true
  try {
    await signedRequest('/v1/state', 'PUT', { state, name: getPlayer()?.name || 'RACER' })
    lastSaved = serialized
    status = 'CLOUD'
  } catch (error) {
    status = 'LOCAL'
    console.log('[HOOF] Cloud save delayed; local cache retained', error)
  } finally {
    requestActive = false
  }
}

async function refreshLeaderboard() {
  if (requestActive) return
  requestActive = true
  try {
    const result = await signedRequest('/v1/leaderboard') as { entries?: LeaderboardEntry[] }
    leaderboard = Array.isArray(result.entries) ? result.entries.slice(0, 10) : []
  } catch {} finally { requestActive = false }
}

export function initializeBackendPersistence() {
  if (initialized) return
  initialized = true
  executeTask(loadCloudState)
  engine.addSystem(updateBackendPersistence)
}

export function updateBackendPersistence(dt: number) {
  if (!initialized) return
  saveTimer -= dt
  leaderboardTimer -= dt
  if (saveTimer <= 0) {
    saveTimer = status === 'LOCAL' ? 12 : 3
    executeTask(saveCloudState)
  }
  if (leaderboardTimer <= 0) {
    leaderboardTimer = 30
    executeTask(refreshLeaderboard)
  }
}

export function getBackendStatus() { return status }
export function getCloudLeaderboard() { return leaderboard }
