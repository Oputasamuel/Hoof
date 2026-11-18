import { ColliderLayer, GltfContainer, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { centerline, constrainToTrack } from '../track'
import { JUMP } from './config'
import { gameEvents } from './events'
import type { HorseController } from './horse'

const MODEL = 'assets/Models/jump-hurdle.glb'
const COURSE_POINTS = [.14, .37, .61, .84]

export interface RaceObstacle {
  position: Vector3
  yaw: number
}

export const raceObstacles: RaceObstacle[] = []

export function createJumpObstacles(): void {
  if (raceObstacles.length) return
  for (const fraction of COURSE_POINTS) {
    const index = Math.floor(centerline.length * fraction) % centerline.length
    const a = centerline[index]
    const b = centerline[(index + 1) % centerline.length]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const length = Math.hypot(dx, dz) || 1
    const rightX = dz / length
    const rightZ = -dx / length
    const yaw = -Math.atan2(rightZ, rightX) * 180 / Math.PI
    const position = Vector3.create(a.x, .765, a.z)
    raceObstacles.push({ position: Vector3.create(a.x, a.y, a.z), yaw })

    const entity = engine.addEntity()
    Transform.create(entity, {
      position,
      rotation: Quaternion.fromEulerDegrees(0, yaw, 0),
      scale: Vector3.create(4.4, 2, 2)
    })
    GltfContainer.create(entity, {
      src: MODEL,
      visibleMeshesCollisionMask: ColliderLayer.CL_NONE,
      invisibleMeshesCollisionMask: ColliderLayer.CL_NONE
    })
  }
}

export function shouldJumpObstacle(position: Vector3, yaw: number): boolean {
  const forwardX = Math.sin(yaw)
  const forwardZ = Math.cos(yaw)
  for (const obstacle of raceObstacles) {
    const dx = obstacle.position.x - position.x
    const dz = obstacle.position.z - position.z
    const ahead = dx * forwardX + dz * forwardZ
    const side = Math.abs(dx * forwardZ - dz * forwardX)
    if (ahead > .5 && ahead < 5.2 && side < JUMP.hitRadius + .55) return true
  }
  return false
}

export function resolveObstacleCollision(horse: HorseController): void {
  if (horse.obstacleCooldown > 0) return
  const transform = Transform.getMutable(horse.root)
  for (const obstacle of raceObstacles) {
    const dx = transform.position.x - obstacle.position.x
    const dz = transform.position.z - obstacle.position.z
    if (Math.hypot(dx, dz) >= JUMP.hitRadius) continue
    if (transform.position.y - horse.groundY >= JUMP.clearHeight) {
      horse.obstacleCooldown = .7
      gameEvents.emit('obstacleCleared', { horseId: horse.id })
      return
    }
    horse.speed = Math.min(horse.speed, JUMP.penaltySpeed)
    horse.obstacleCooldown = .55
    transform.position = constrainToTrack(Vector3.create(
      transform.position.x - Math.sin(horse.yaw) * .7,
      transform.position.y,
      transform.position.z - Math.cos(horse.yaw) * .7
    ))
    return
  }
}
