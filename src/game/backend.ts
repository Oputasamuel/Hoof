import { engine, executeTask } from '@dcl/sdk/ecs'
import { signedFetch } from '~system/SignedFetch'
import { getPlayer } from '@dcl/sdk/players'
import {
  claimDailyReward as claimDailyRewardLocal,
  equipHorse as equipHorseLocal,
  exportEconomyState,
  hydrateEconomyState,
  purchaseHorse as purchaseHorseLocal,
  setLastRewardMessage
} from './economy'
import { exportDailyState, hydrateDailyState } from './dailyTasks'
import { gameEvents, RaceResult } from './events'
import { gameState } from './state'

export const HOOF_BACKEND_URL = 'https://hoof-dcl-api.onrender.com'

type CloudState = {
  economy: ReturnType<typeof exportEconomyState>
  daily: ReturnType<typeof exportDailyState>
}
type StateResponse = { state?: CloudState | null; message?: string }
export type LeaderboardEntry = { rank: number; address: string; name: string; points: number }

let status: 'CONNECTING' | 'CLOUD' | 'LOCAL' = 'CONNECTING'
let initialized = false
let hydrated = false
let loadActive = false
let retryTimer = 0
let leaderboardTimer = 0
let leaderboard: LeaderboardEntry[] = []
let activeRacePromise: Promise<string | undefined> | undefined
let raceJumps = 0
let raceClean = true

function snapshot(): CloudState { return { economy: exportEconomyState(), daily: exportDailyState() } }
function playerName() { return getPlayer()?.name || 'RACER' }
function applyCloudState(value?: CloudState | null) {
  if (!value) return
  hydrateEconomyState(value.economy)
  hydrateDailyState(value.daily)
}

async function signedRequest(path: string, method = 'GET', body?: unknown) {
  const response = await signedFetch({
    url: `${HOOF_BACKEND_URL}${path}`,
    init: { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }
  })
  const result = response.body ? JSON.parse(response.body) : {}
  if (!response.ok) throw new Error(result.message || `HOOF backend returned ${response.status}`)
  return result
}

async function loadCloudState() {
  if (loadActive) return
  loadActive = true
  try {
    let result = await signedRequest('/v1/state') as StateResponse
    if (!result.state) result = await signedRequest('/v1/state', 'PUT', { state: snapshot(), name: playerName() }) as StateResponse
    applyCloudState(result.state)
    hydrated = true
    status = 'CLOUD'
    retryTimer = 30
  } catch (error) {
    console.log('[HOOF] Cloud persistence unavailable; local cache remains active', error)
    hydrated = true
    status = 'LOCAL'
    retryTimer = 12
  } finally { loadActive = false }
}

async function refreshLeaderboard() {
  try {
    const result = await signedRequest('/v1/leaderboard') as { entries?: LeaderboardEntry[] }
    leaderboard = Array.isArray(result.entries) ? result.entries.slice(0, 100) : []
  } catch {}
}

async function startAuthoritativeRace(seed: number) {
  if (status !== 'CLOUD') return undefined
  try {
    const result = await signedRequest('/v1/races/start', 'POST', { seed, difficulty: gameState.difficulty, name: playerName() }) as { raceId?: string }
    return result.raceId
  } catch (error) {
    console.log('[HOOF] Race validation session unavailable; race remains local', error)
    return undefined
  }
}

async function finishAuthoritativeRace(results: RaceResult[]) {
  const raceId = await activeRacePromise
  activeRacePromise = undefined
  const player = results.find(result => result.horseId === 0)
  if (!raceId || !player?.time) return
  try {
    const response = await signedRequest(`/v1/races/${raceId}/finish`, 'POST', {
      name: playerName(), place: player.place, time: player.time, laps: player.laps,
      jumps: raceJumps, clean: raceClean
    }) as StateResponse
    applyCloudState(response.state)
    status = 'CLOUD'
    await refreshLeaderboard()
  } catch (error) {
    console.log('[HOOF] Race reward validation failed; local result retained', error)
  }
}

export async function claimDailyRewardCloud() {
  if (status === 'CLOUD') {
    try {
      const response = await signedRequest('/v1/daily/claim', 'POST', { name: playerName() }) as StateResponse
      applyCloudState(response.state)
      if (response.message) setLastRewardMessage(response.message)
      return
    } catch (error) { console.log('[HOOF] Cloud daily claim failed; using local reward', error) }
  }
  claimDailyRewardLocal()
}

export async function purchaseHorseCloud(id: string) {
  if (status === 'CLOUD') {
    try {
      const response = await signedRequest(`/v1/horses/${id}/purchase`, 'POST', { name: playerName() }) as StateResponse
      applyCloudState(response.state)
      if (response.message) setLastRewardMessage(response.message)
      return true
    } catch (error) { console.log('[HOOF] Cloud horse purchase rejected', error); return false }
  }
  return purchaseHorseLocal(id)
}

export async function equipHorseCloud(id: string) {
  if (status === 'CLOUD') {
    try {
      const response = await signedRequest(`/v1/horses/${id}/equip`, 'POST', { name: playerName() }) as StateResponse
      applyCloudState(response.state)
      if (response.message) setLastRewardMessage(response.message)
      return true
    } catch (error) { console.log('[HOOF] Cloud horse equip rejected', error); return false }
  }
  return equipHorseLocal(id)
}

export function initializeBackendPersistence() {
  if (initialized) return
  initialized = true
  gameEvents.on('raceStarted', ({ seed }) => { raceJumps = 0; raceClean = true; activeRacePromise = startAuthoritativeRace(seed) })
  gameEvents.on('obstacleCleared', ({ horseId }) => { if (horseId === 0) raceJumps++ })
  gameEvents.on('offTrackEntered', ({ horseId }) => { if (horseId === 0) raceClean = false })
  gameEvents.on('wrongWayStarted', ({ horseId }) => { if (horseId === 0) raceClean = false })
  gameEvents.on('raceFinished', ({ results }) => executeTask(() => finishAuthoritativeRace(results)))
  executeTask(loadCloudState)
  engine.addSystem(updateBackendPersistence)
}

export function updateBackendPersistence(dt: number) {
  if (!initialized || !hydrated) return
  retryTimer -= dt
  leaderboardTimer -= dt
  if (status === 'LOCAL' && retryTimer <= 0) { retryTimer = 12; executeTask(loadCloudState) }
  if (leaderboardTimer <= 0) { leaderboardTimer = 30; executeTask(refreshLeaderboard) }
}

export function getBackendStatus() { return status }
export function getCloudLeaderboard() { return leaderboard }
