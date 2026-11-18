import { Animator, QuaternionType, TextShape, Transform } from '@dcl/sdk/ecs'
import { MessageBus } from '@dcl/sdk/message-bus'
import { getPlayer } from '@dcl/sdk/players'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { Difficulty } from './config'
import { getEquippedHorse } from './economy'
import { HorseController } from './horse'
import { setHorseModel } from './horseFactory'
import { RaceResult } from './events'
import { RaceState, gameState } from './state'
import { initializeBackendPersistence } from './backend'

type NetworkHorseState = {
  userId: string
  name: string
  x: number
  y: number
  z: number
  qx: number
  qy: number
  qz: number
  qw: number
  yaw: number
  speed: number
  stamina: number
  jumping: boolean
  modelPath: string
  lap: number
  sentAt: number
}

type Peer = {
  userId: string
  name: string
  slot: number
  lastSeen: number
  state?: NetworkHorseState
  modelPath?: string
  ready: boolean
}

type ScheduledStart = { difficulty: Difficulty; seed: number; startAt: number }

const bus = new MessageBus()
const peers = new Map<string, Peer>()
let localId = ''
let localName = 'RACER'
let helloTimer = 0
let stateTimer = 0
let readyTimer = 0
let crownBond = 0
let localReady = false
let pendingStart: ScheduledStart | undefined
let initialized = false
let horsesRef: HorseController[] = []
let onRemoteStart: (difficulty: Difficulty, seed: number) => void = () => {}

const TEAM_GOLD = Color4.create(1, .66, .12, 1)
const TEAM_PURPLE = Color4.create(.72, .35, 1, 1)

function updateIdentity() {
  const player = getPlayer()
  if (player) {
    localId = player.userId.toLowerCase()
    localName = player.name || 'RACER'
  }
}

function roster() {
  const ids = [...peers.keys()]
  if (localId) ids.push(localId)
  return [...new Set(ids)].sort()
}

function teamIndexFor(userId: string) {
  const index = roster().indexOf(userId.toLowerCase())
  return index < 0 ? 0 : Math.floor(index / 2) % 2
}

function teamNameFor(userId: string) { return teamIndexFor(userId) === 0 ? 'GOLD STABLE' : 'PURPLE STABLE' }
function teamColorFor(userId: string) { return teamIndexFor(userId) === 0 ? TEAM_GOLD : TEAM_PURPLE }

function nextSlot() {
  const used = new Set([...peers.values()].map(peer => peer.slot))
  for (let slot = 1; slot < horsesRef.length; slot++) if (!used.has(slot)) return slot
  return -1
}

function ensurePeer(userId: string, name: string) {
  const id = userId.toLowerCase()
  if (!id || id === localId || id === 'self') return undefined
  let peer = peers.get(id)
  if (!peer) {
    const slot = nextSlot()
    if (slot < 0) return undefined
    peer = { userId: id, name: name || `RACER ${slot + 1}`, slot, lastSeen: Date.now(), ready: false }
    peers.set(id, peer)
  }
  peer.name = name || peer.name
  peer.lastSeen = Date.now()
  return peer
}

function setMarker(horse: HorseController, label: string, color: Color4) {
  const marker = TextShape.getMutable(horse.marker)
  marker.text = label
  marker.textColor = color
}

function applyRemoteState(peer: Peer, dt: number) {
  const state = peer.state
  const horse = horsesRef[peer.slot]
  if (!state || !horse) return
  if (peer.modelPath !== state.modelPath) {
    setHorseModel(horse, state.modelPath)
    peer.modelPath = state.modelPath
  }
  const t = Transform.getMutable(horse.root)
  const blend = 1 - Math.exp(-12 * Math.min(dt, .05))
  t.position = Vector3.create(
    t.position.x + (state.x - t.position.x) * blend,
    t.position.y + (state.y - t.position.y) * blend,
    t.position.z + (state.z - t.position.z) * blend
  )
  const target = Quaternion.create(state.qx, state.qy, state.qz, state.qw)
  t.rotation = Quaternion.slerp(t.rotation as QuaternionType, target, blend)
  horse.yaw = state.yaw
  horse.speed = state.speed
  horse.stamina = state.stamina
  horse.jumping = state.jumping
  const clip = state.speed < .35 ? 'Idle' : state.speed >= 5.2 ? 'Run' : 'Walk'
  if (horse.activeAnimation !== clip) {
    Animator.playSingleAnimation(horse.visual, clip, true)
    horse.activeAnimation = clip
  }
  const animState = Animator.getMutable(horse.visual).states.find(item => item.clip === clip)
  if (animState) {
    animState.playing = true
    animState.loop = true
    animState.speed = clip === 'Run' ? Math.max(.85, Math.min(1.48, state.speed / 9.5)) : clip === 'Walk' ? Math.max(.75, Math.min(1.35, state.speed / 3.8)) : 1
  }
  setMarker(horse, `${peer.name}\n${teamNameFor(peer.userId)}`, teamColorFor(peer.userId))
}

function partnerPeer() {
  if (!localId) return undefined
  const myTeam = teamIndexFor(localId)
  return [...peers.values()].find(peer => teamIndexFor(peer.userId) === myTeam)
}

export function initializeMultiplayer(horses: HorseController[], remoteStart: (difficulty: Difficulty, seed: number) => void) {
  if (initialized) return
  initialized = true
  initializeBackendPersistence()
  horsesRef = horses
  onRemoteStart = remoteStart
  updateIdentity()
  bus.on('hoof-hello-v1', (payload: { userId?: string; name?: string }) => {
    if (!payload?.userId) return
    ensurePeer(payload.userId, payload.name ?? '')
  })
  bus.on('hoof-horse-state-v1', (payload: NetworkHorseState) => {
    if (!payload?.userId) return
    const peer = ensurePeer(payload.userId, payload.name)
    if (peer) peer.state = payload
  })
  bus.on('hoof-ready-v1', (payload: { userId?: string; name?: string; ready?: boolean }) => {
    if (!payload?.userId) return
    const peer = ensurePeer(payload.userId, payload.name ?? '')
    if (peer) peer.ready = !!payload.ready
  })
  bus.on('hoof-ready-start-v1', (payload: { userId?: string; difficulty?: Difficulty; seed?: number; startAt?: number }) => {
    if (!payload?.userId || !payload.difficulty || !payload.seed || !payload.startAt) return
    if (!localReady || gameState.state !== RaceState.DIFFICULTY_SELECT) return
    ensurePeer(payload.userId, '')
    pendingStart = { difficulty: payload.difficulty, seed: payload.seed, startAt: payload.startAt }
    gameState.menuPage = 'PADDOCK'
  })
  bus.on('hoof-race-start-v1', (payload: { userId?: string; difficulty?: Difficulty; seed?: number }) => {
    if (!payload?.userId || payload.userId.toLowerCase() === localId || !payload.difficulty || !payload.seed) return
    ensurePeer(payload.userId, '')
    if (gameState.state === RaceState.DIFFICULTY_SELECT) onRemoteStart(payload.difficulty, payload.seed)
  })
}

function emitReady() {
  updateIdentity()
  bus.emit('hoof-ready-v1', { userId: localId, name: localName, ready: localReady })
}

function maybeScheduleRace(difficulty: Difficulty) {
  if (pendingStart || !localReady || peers.size < 1) return
  const everyoneReady = [...peers.values()].every(peer => peer.ready)
  const hostId = roster()[0]
  if (!everyoneReady || hostId !== localId) return
  const scheduled: ScheduledStart = {
    difficulty,
    seed: ((Date.now() ^ 0x6d2b79f5) >>> 0) || 1,
    startAt: Date.now() + 4000
  }
  pendingStart = scheduled
  bus.emit('hoof-ready-start-v1', { userId: localId, ...scheduled })
}

export function setPaddockReady(ready: boolean, difficulty: Difficulty) {
  localReady = ready
  pendingStart = undefined
  readyTimer = 0
  emitReady()
  if (ready) maybeScheduleRace(difficulty)
}

export function leavePaddock() {
  localReady = false
  pendingStart = undefined
  emitReady()
}

export function getPaddockHud() {
  const entries = roster().map(id => {
    const peer = peers.get(id)
    return {
      userId: id,
      name: id === localId ? localName : peer?.name || 'RACER',
      teamName: teamNameFor(id),
      ready: id === localId ? localReady : !!peer?.ready,
      local: id === localId
    }
  })
  return {
    entries,
    localReady,
    players: entries.length,
    waitingForPlayers: entries.length < 2,
    countdown: pendingStart ? Math.max(0, Math.ceil((pendingStart.startAt - Date.now()) / 1000)) : 0
  }
}

export function announceRaceStart(difficulty: Difficulty, seed: number) {
  updateIdentity()
  bus.emit('hoof-race-start-v1', { userId: localId, difficulty, seed })
}

export function isRemoteHorse(horseId: number) {
  return [...peers.values()].some(peer => peer.slot === horseId && Date.now() - peer.lastSeen < 5000)
}

export function updateMultiplayer(localHorse: HorseController, localLap: number, dt: number) {
  if (!initialized) return
  updateIdentity()
  helloTimer -= dt
  stateTimer -= dt
  readyTimer -= dt
  if (helloTimer <= 0) {
    helloTimer = 3
    bus.emit('hoof-hello-v1', { userId: localId, name: localName })
  }
  if (stateTimer <= 0) {
    stateTimer = .1
    const t = Transform.get(localHorse.root)
    bus.emit('hoof-horse-state-v1', {
      userId: localId,
      name: localName,
      x: t.position.x, y: t.position.y, z: t.position.z,
      qx: t.rotation.x, qy: t.rotation.y, qz: t.rotation.z, qw: t.rotation.w,
      yaw: localHorse.yaw,
      speed: localHorse.speed,
      stamina: localHorse.stamina,
      jumping: localHorse.jumping,
      modelPath: getEquippedHorse().modelPath,
      lap: localLap,
      sentAt: Date.now()
    } as NetworkHorseState)
  }
  if (readyTimer <= 0) {
    readyTimer = 1.5
    emitReady()
  }
  for (const [id, peer] of peers) {
    if (Date.now() - peer.lastSeen > 7000) {
      setMarker(horsesRef[peer.slot], String(peer.slot + 1), Color4.Blue())
      peers.delete(id)
      continue
    }
    applyRemoteState(peer, dt)
  }
  const partner = partnerPeer()
  if (partner?.state && (gameState.state === RaceState.RACING || gameState.state === RaceState.PLAYER_FINISHED)) {
    const localPosition = Transform.get(localHorse.root).position
    const distance = Math.hypot(partner.state.x - localPosition.x, partner.state.z - localPosition.z)
    const linked = distance <= 7 && localHorse.speed > 3 && partner.state.speed > 3
    const synchronizedJump = linked && localHorse.jumping && partner.state.jumping
    crownBond = Math.max(0, Math.min(100, crownBond + (linked ? (synchronizedJump ? 30 : 13) : -11) * dt))
  } else crownBond = Math.max(0, crownBond - 9 * dt)
  if (localId) setMarker(localHorse, `YOU\n${teamNameFor(localId)}`, teamColorFor(localId))
  if (gameState.state === RaceState.DIFFICULTY_SELECT && gameState.menuPage === 'PADDOCK') {
    maybeScheduleRace(gameState.difficulty)
  }
  if (pendingStart && Date.now() >= pendingStart.startAt && gameState.state === RaceState.DIFFICULTY_SELECT) {
    const start = pendingStart
    pendingStart = undefined
    localReady = false
    for (const peer of peers.values()) peer.ready = false
    onRemoteStart(start.difficulty, start.seed)
  }
}

export function getMultiplayerHud() {
  return {
    players: 1 + peers.size,
    teamName: localId ? teamNameFor(localId) : 'GOLD STABLE',
    crownBond,
    linked: !!partnerPeer()?.state && crownBond > 0
  }
}

export function getCrownStaminaMultiplier() { return crownBond >= 20 && partnerPeer()?.state ? .72 : 1 }

export function getTeamResult(results: RaceResult[]) {
  if (!localId || peers.size < 3) return peers.size ? `${teamNameFor(localId)} • ${1 + peers.size} PLAYER RACE` : 'SOLO RACE • AI FIELD'
  const teamScores = [0, 0]
  for (const result of results) {
    if (result.horseId === 0) teamScores[teamIndexFor(localId)] += result.place
    else {
      const peer = [...peers.values()].find(item => item.slot === result.horseId)
      if (peer) teamScores[teamIndexFor(peer.userId)] += result.place
    }
  }
  const winner = teamScores[0] <= teamScores[1] ? 'GOLD STABLE' : 'PURPLE STABLE'
  return `${winner} WINS • GOLD ${teamScores[0]} — ${teamScores[1]} PURPLE`
}
