import { Animator, ColliderLayer, GltfContainer, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

const MODELS = [1, 2, 3, 4].map(index => `assets/Models/Horses/horse-0${index}.glb`)

type HorsePlacement = { x: number; z: number; yaw: number; scale?: number; walking?: boolean }

const PLACEMENTS: HorsePlacement[] = [
  // Infield grazing herd, well clear of the racing rail.
  { x: 25.0, z: 27.0, yaw: 18 }, { x: 29.0, z: 25.2, yaw: -22 },
  { x: 34.0, z: 27.2, yaw: 42 }, { x: 38.0, z: 25.5, yaw: -38 },
  { x: 23.8, z: 33.0, yaw: 78 }, { x: 28.2, z: 35.7, yaw: 112 },
  { x: 35.8, z: 35.2, yaw: -118 }, { x: 40.0, z: 32.0, yaw: -75 },
  { x: 31.8, z: 31.0, yaw: 165, scale: .94 }, { x: 36.8, z: 29.8, yaw: -160, scale: .96 },
  // Royal stable and ceremonial courtyard horses.
  { x: 18.0, z: 58.0, yaw: 10 }, { x: 21.0, z: 60.0, yaw: -12 },
  { x: 43.0, z: 60.0, yaw: 18 }, { x: 46.0, z: 58.0, yaw: -20 },
  { x: 5.0, z: 47.5, yaw: 75, walking: true }, { x: 59.0, z: 47.5, yaw: -75, walking: true },
  { x: 5.2, z: 17.0, yaw: 105 }, { x: 58.8, z: 17.0, yaw: -105 },
  { x: 15.0, z: 6.0, yaw: 155 }, { x: 49.0, z: 6.0, yaw: -155 }
]

let created = false

export function createAmbientHorses(): void {
  if (created) return
  created = true
  PLACEMENTS.forEach((placement, index) => {
    const horse = engine.addEntity()
    const scale = placement.scale ?? (0.9 + (index % 4) * .025)
    Transform.create(horse, {
      position: Vector3.create(placement.x, .24, placement.z),
      rotation: Quaternion.fromEulerDegrees(0, placement.yaw, 0),
      scale: Vector3.create(scale, scale, scale)
    })
    GltfContainer.create(horse, {
      src: MODELS[index % MODELS.length],
      visibleMeshesCollisionMask: ColliderLayer.CL_NONE,
      invisibleMeshesCollisionMask: ColliderLayer.CL_NONE
    })
    Animator.create(horse, {
      states: [
        { clip: 'Idle', playing: !placement.walking, loop: true, speed: .82 + (index % 5) * .04 },
        { clip: 'Walk', playing: !!placement.walking, loop: true, speed: .72 + (index % 3) * .08 },
        { clip: 'Run', playing: false, loop: true, speed: 1 }
      ]
    })
  })
  console.log(`[Horse Racing] ambient royal horses ready: ${PLACEMENTS.length}`)
}
