import { Transform } from '@dcl/sdk/ecs'
import { centerline, progressAt, trackWidth } from '../track'
import { AI_PRESETS, Difficulty, DRIVE } from './config'
import { HorseController, HorseInput } from './horse'
import { mulberry32 } from './rng'
import { shouldJumpObstacle } from './obstacles'

export interface AiDriver {
  horse: HorseController
  baseSpeed: number
  offset: number
  noise: number
  noiseTimer: number
  boostUsage: number
  random: () => number
  mistakeTimer: number
  mistakeDuration: number
  steerBias: number
  hesitationTimer: number
  jumpDecisionTimer: number
  jumpPlan: boolean
}

const wrap = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

function target(h: HorseController, offset: number) {
  const p = Transform.get(h.root).position
  let best = 0
  let distance = 1e9
  for (let i = 0; i < centerline.length; i++) {
    const q = centerline[i]
    const next = (q.x - p.x) ** 2 + (q.z - p.z) ** 2
    if (next < distance) { distance = next; best = i }
  }
  const lookAhead = 3 + Math.floor(h.speed / 3)
  const a = centerline[(best + lookAhead) % centerline.length]
  const b = centerline[(best + lookAhead + 1) % centerline.length]
  const dx = b.x - a.x
  const dz = b.z - a.z
  const length = Math.hypot(dx, dz) || 1
  return { x: a.x - dz / length * offset, z: a.z + dx / length * offset }
}

export function createAi(horses: HorseController[], difficulty: Difficulty, seed: number): AiDriver[] {
  const seeded = mulberry32(seed)
  const preset = AI_PRESETS[difficulty]
  return horses.slice(1).map((horse, index) => {
    const random = mulberry32(((seed + 1) * (index + 17) * 2654435761) >>> 0)
    return {
      horse,
      baseSpeed: preset.min + seeded() * (preset.max - preset.min),
      offset: (seeded() - .5) * (trackWidth - 2),
      noise: (seeded() - .5) * .4,
      noiseTimer: 1 + seeded() * 2,
      boostUsage: .2 + seeded() * .55,
      random,
      mistakeTimer: .8 + random() * 2,
      mistakeDuration: 0,
      steerBias: 0,
      hesitationTimer: 0,
      jumpDecisionTimer: 0,
      jumpPlan: false
    }
  })
}

export function updateAi(ai: AiDriver, player: HorseController, difficulty: Difficulty, dt: number): HorseInput {
  const preset = AI_PRESETS[difficulty]
  ai.noiseTimer -= dt
  if (ai.noiseTimer <= 0) {
    ai.noiseTimer = 1.25 + ai.random() * 2.5
    ai.noise = (ai.random() - .5) * .8
  }

  ai.mistakeTimer -= dt
  ai.mistakeDuration = Math.max(0, ai.mistakeDuration - dt)
  ai.hesitationTimer = Math.max(0, ai.hesitationTimer - dt)
  if (ai.mistakeTimer <= 0) {
    ai.mistakeTimer = 1.4 + ai.random() * 2.8
    if (ai.random() < preset.mistakeRate) {
      ai.mistakeDuration = .45 + ai.random() * .85
      ai.steerBias = (ai.random() - .5) * .75
      ai.hesitationTimer = preset.hesitation * (.55 + ai.random() * .65)
    }
  }
  if (ai.mistakeDuration <= 0) ai.steerBias = 0

  const h = ai.horse
  const position = Transform.get(h.root).position
  const waypoint = target(h, ai.offset)
  const desired = Math.atan2(waypoint.x - position.x, waypoint.z - position.z)
  const steer = Math.max(-1, Math.min(1, wrap(desired - h.yaw) / .55 + ai.steerBias))
  const delta = progressAt(Transform.get(player.root).position) - progressAt(position)
  const rubberBand = Math.max(-1, Math.min(1, delta * 5)) * preset.rubberBand
  const hesitation = ai.hesitationTimer > 0 ? .72 : 1
  const base = (ai.baseSpeed * (1 + rubberBand) + ai.noise) * hesitation
  const boost = ai.hesitationTimer <= 0 && Math.abs(steer) < .22 && delta > .08 && h.stamina > 42 && ai.boostUsage > .48

  ai.jumpDecisionTimer = Math.max(0, ai.jumpDecisionTimer - dt)
  const obstacleAhead = shouldJumpObstacle(position, h.yaw)
  if (obstacleAhead && ai.jumpDecisionTimer <= 0) {
    ai.jumpPlan = ai.random() < preset.jumpReliability
    ai.jumpDecisionTimer = 1.35
  } else if (!obstacleAhead && ai.jumpDecisionTimer <= 0) ai.jumpPlan = false
  const jump = obstacleAhead && ai.jumpPlan

  return {
    steer,
    boost,
    jump,
    targetSpeed: boost ? Math.min(DRIVE.boostSpeed, base + 1.25) : base
  }
}
