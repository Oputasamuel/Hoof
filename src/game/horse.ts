import { Animator, Entity, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { centerline, constrainToTrack, lateralOffsetAt, trackBounds, trackWidth } from '../track'
import { DRIVE, JUMP, STAMINA } from './config'
import { audio } from './audio'

export interface HorseInput {
  steer: number
  boost: boolean
  jump: boolean
  targetSpeed?: number
}

export interface HorseController {
  id: number
  root: Entity
  visual: Entity
  marker: Entity
  speed: number
  stamina: number
  boostLocked: boolean
  boosting: boolean
  sprintBlend: number
  yaw: number
  smoothedSteer: number
  surfaceSpeedMultiplier: number
  activeAnimation: 'Idle' | 'Walk' | 'Run'
  animationSpeed: number
  lateral: number
  offTrack: boolean
  groundY: number
  verticalVelocity: number
  jumping: boolean
  jumpHeld: boolean
  obstacleCooldown: number
}

const D = Math.PI / 180
const toward = (a: number, b: number, d: number) => Math.abs(b - a) <= d ? b : a + Math.sign(b - a) * d

function nearest(p: Vector3) {
  let n = centerline[0]
  let best = 1e9
  for (const q of centerline) {
    const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2
    if (d < best) { best = d; n = q }
  }
  return n
}

function anim(h: HorseController, clip: HorseController['activeAnimation'], speed: number) {
  const stepped = Math.round(speed * 10) / 10
  const clipChanged = h.activeAnimation !== clip
  if (clipChanged) {
    Animator.playSingleAnimation(h.visual, clip, true)
    h.activeAnimation = clip
  }
  if (clipChanged || Math.abs(h.animationSpeed - stepped) >= .09) {
    const state = Animator.getMutable(h.visual).states.find(x => x.clip === clip)
    if (state) { state.speed = stepped; state.loop = true; state.playing = true }
    h.animationSpeed = stepped
  }
}

function updateAnim(h: HorseController) {
  if (h.speed < .35) { anim(h, 'Idle', 1); return }
  const shouldRun = h.activeAnimation === 'Run' ? h.speed >= 4.4 : h.speed >= 5.2
  if (shouldRun) anim(h, 'Run', Math.max(.85, Math.min(1.48, h.speed / 9.5)))
  else anim(h, 'Walk', Math.max(.75, Math.min(1.35, h.speed / 3.8)))
}

export function resetHorse(h: HorseController, p: Vector3, r: Quaternion) {
  const t = Transform.getMutable(h.root)
  t.position = Vector3.create(p.x, p.y, p.z)
  t.rotation = r
  Object.assign(h, {
    speed: 0, stamina: 100, boostLocked: false, boosting: false, sprintBlend: 0,
    yaw: -Math.PI / 2, smoothedSteer: 0, surfaceSpeedMultiplier: 1,
    animationSpeed: 0, lateral: 0, offTrack: false, groundY: p.y,
    verticalVelocity: 0, jumping: false, jumpHeld: false, obstacleCooldown: 0
  })
  anim(h, 'Idle', 1)
}

export function updateHorse(h: HorseController, input: HorseInput, dt: number, speedCap = 99, staminaUseMultiplier = 1) {
  const step = Math.min(dt, .05)
  if (h.boostLocked && h.stamina >= STAMINA.unlockAt) h.boostLocked = false
  h.boosting = input.boost && !h.boostLocked && h.stamina > 0
  h.sprintBlend = toward(h.sprintBlend, h.boosting ? 1 : 0, (h.boosting ? DRIVE.sprintBlendIn : DRIVE.sprintBlendOut) * step)
  if (h.boosting) {
    h.stamina = Math.max(0, h.stamina - STAMINA.drainPerSecond * staminaUseMultiplier * step)
    if (h.stamina <= STAMINA.lockBelow) h.boostLocked = true
  } else h.stamina = Math.min(100, h.stamina + STAMINA.regenPerSecond * step)

  const t = Transform.getMutable(h.root)
  const jumpPressed = input.jump && !h.jumpHeld
  h.jumpHeld = input.jump
  if (jumpPressed && !h.jumping && h.speed > .5) {
    h.jumping = true
    h.verticalVelocity = JUMP.velocity
    audio.jump(h.id)
  }
  if (h.jumping) {
    h.verticalVelocity -= JUMP.gravity * step
    const nextY = t.position.y + h.verticalVelocity * step
    if (nextY <= h.groundY) {
      t.position = Vector3.create(t.position.x, h.groundY, t.position.z)
      h.verticalVelocity = 0
      h.jumping = false
    } else t.position = Vector3.create(t.position.x, nextY, t.position.z)
  }
  h.obstacleCooldown = Math.max(0, h.obstacleCooldown - step)

  h.lateral = lateralOffsetAt(t.position)
  const was = h.offTrack
  h.offTrack = Math.abs(h.lateral) > trackWidth / 2
  const surface = h.offTrack ? DRIVE.offTrackSpeedMultiplier : 1
  h.surfaceSpeedMultiplier += (surface - h.surfaceSpeedMultiplier) * (1 - Math.exp(-DRIVE.offTrackBlendRate * step))
  const base = input.targetSpeed ?? DRIVE.cruiseSpeed
  const target = Math.min(speedCap, (base + (DRIVE.boostSpeed - base) * h.sprintBlend) * h.surfaceSpeedMultiplier)
  h.speed = toward(h.speed, target, (target < h.speed ? DRIVE.braking : DRIVE.acceleration) * step)
  h.smoothedSteer += (input.steer - h.smoothedSteer) * (1 - Math.exp(-DRIVE.steeringResponse * step))
  const ratio = Math.min(1, h.speed / DRIVE.boostSpeed)
  h.yaw += h.smoothedSteer * (DRIVE.lowSpeedYawRate + (DRIVE.highSpeedYawRate - DRIVE.lowSpeedYawRate) * ratio) * D * step

  let dx = Math.sin(h.yaw) * h.speed * step
  let dz = Math.cos(h.yaw) * h.speed * step
  if (Math.abs(h.lateral) > trackWidth / 2 + DRIVE.edgePushDistance) {
    const c = nearest(t.position)
    const length = Math.hypot(c.x - t.position.x, c.z - t.position.z) || 1
    dx += (c.x - t.position.x) / length * DRIVE.edgePushRate * step
    dz += (c.z - t.position.z) / length * DRIVE.edgePushRate * step
  }
  const proposed = Vector3.create(
    Math.max(trackBounds.minX, Math.min(trackBounds.maxX, t.position.x + dx)),
    t.position.y,
    Math.max(trackBounds.minZ, Math.min(trackBounds.maxZ, t.position.z + dz))
  )
  t.position = constrainToTrack(proposed)
  const jumpPitch = h.jumping ? Math.max(-11, Math.min(11, -h.verticalVelocity * 1.35)) : 0
  t.rotation = Quaternion.fromEulerDegrees(jumpPitch, h.yaw / D, 0)
  updateAnim(h)
  return !was && h.offTrack
}

export function separateHorses(horses: HorseController[], dt: number) {
  for (let i = 0; i < horses.length; i++) for (let j = i + 1; j < horses.length; j++) {
    const a = Transform.getMutable(horses[i].root)
    const b = Transform.getMutable(horses[j].root)
    const dx = b.position.x - a.position.x
    const dz = b.position.z - a.position.z
    const distance = Math.hypot(dx, dz)
    if (distance > 0 && distance < DRIVE.separationDistance) {
      const push = (DRIVE.separationDistance - distance) * DRIVE.separationRate * dt * .5
      const nx = dx / distance
      const nz = dz / distance
      a.position = Vector3.create(a.position.x - nx * push, a.position.y, a.position.z - nz * push)
      b.position = Vector3.create(b.position.x + nx * push, b.position.y, b.position.z + nz * push)
    }
  }
  for (const horse of horses) {
    const t = Transform.getMutable(horse.root)
    t.position = constrainToTrack(t.position)
  }
}
