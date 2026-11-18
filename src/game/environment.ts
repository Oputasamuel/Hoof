import { ColliderLayer, GltfContainer, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { centerline, finishLine, trackWidth } from '../track'

const BARRIER_MODEL = 'assets/Models/track-barrier.glb'
const ARCH_MODEL = 'assets/Models/race-arch.glb'
const BARRIER_SOURCE_WIDTH = 0.94873
const BARRIER_HEIGHT_SCALE = 2.34
const EDGE_OFFSET = trackWidth / 2 + 0.5

function hideAuthoredEntity(name: string): void {
  const entity = engine.getEntityOrNullByName(name)
  if (entity === null) return
  Transform.getMutable(entity).scale = Vector3.Zero()
}

function addBarrier(a: Vector3, b: Vector3, side: -1 | 1): void {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const length = Math.hypot(dx, dz)
  if (length < 0.1) return

  const rightX = dz / length
  const rightZ = -dx / length
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.create(
      (a.x + b.x) * 0.5 + rightX * EDGE_OFFSET * side,
      0.6,
      (a.z + b.z) * 0.5 + rightZ * EDGE_OFFSET * side
    ),
    rotation: Quaternion.fromEulerDegrees(0, -Math.atan2(dz, dx) * 180 / Math.PI, 0),
    scale: Vector3.create(length * 1.035 / BARRIER_SOURCE_WIDTH, BARRIER_HEIGHT_SCALE, 2)
  })
  GltfContainer.create(entity, {
    src: BARRIER_MODEL,
    visibleMeshesCollisionMask: ColliderLayer.CL_NONE,
    invisibleMeshesCollisionMask: ColliderLayer.CL_NONE
  })
}

function addRaceArch(): void {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.create(finishLine.center.x, 4.05, finishLine.center.z),
    rotation: Quaternion.fromEulerDegrees(0, 90, 0),
    scale: Vector3.create(13, 13, 13)
  })
  GltfContainer.create(entity, {
    src: ARCH_MODEL,
    visibleMeshesCollisionMask: ColliderLayer.CL_NONE,
    invisibleMeshesCollisionMask: ColliderLayer.CL_NONE
  })
}

export function createRaceEnvironment(): void {
  hideAuthoredEntity('02 Track Rails')
  hideAuthoredEntity('StartGate')
  hideAuthoredEntity('StartGate North Post')
  hideAuthoredEntity('StartGate South Post')
  hideAuthoredEntity('StartGate Header')
  hideAuthoredEntity('StartGate Sign')

  for (let i = 0; i < centerline.length; i++) {
    const a = centerline[i]
    const b = centerline[(i + 1) % centerline.length]
    addBarrier(a, b, -1)
    addBarrier(a, b, 1)
  }
  addRaceArch()
}
