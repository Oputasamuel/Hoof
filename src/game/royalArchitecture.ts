import { ColliderLayer, GltfContainer, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

const GRANDSTAND_MODEL = 'assets/Models/royal-grandstand.glb'
const LODGE_MODEL = 'assets/Models/royal-lodge.glb'

interface BuildingPlacement {
  position: Vector3
  rotationY: number
  scale: Vector3
}

const GRANDSTANDS: BuildingPlacement[] = [
  // Huge northern pavilion behind the original seating tiers.
  { position: Vector3.create(32, 5.05, 4.25), rotationY: 180, scale: Vector3.create(29, 18, 5) },
  // Long covered wings enclosing both curved ends of the racecourse.
  { position: Vector3.create(3.35, 5.05, 32), rotationY: 90, scale: Vector3.create(24, 18, 5) },
  { position: Vector3.create(60.65, 5.05, 32), rotationY: -90, scale: Vector3.create(24, 18, 5) },
  // Southern wings frame the lobby and leave a ceremonial central entrance.
  { position: Vector3.create(14, 3.65, 59.4), rotationY: 0, scale: Vector3.create(14, 13, 4) },
  { position: Vector3.create(50, 3.65, 59.4), rotationY: 0, scale: Vector3.create(14, 13, 4) }
]

const LODGES: BuildingPlacement[] = [
  // Corner estate houses make the exterior read as a complete royal complex.
  { position: Vector3.create(7.2, 3.18, 7.5), rotationY: 135, scale: Vector3.create(8, 10, 8) },
  { position: Vector3.create(56.8, 3.18, 7.5), rotationY: -135, scale: Vector3.create(8, 10, 8) },
  { position: Vector3.create(7.2, 3.18, 56.5), rotationY: 45, scale: Vector3.create(8, 10, 8) },
  { position: Vector3.create(56.8, 3.18, 56.5), rotationY: -45, scale: Vector3.create(8, 10, 8) },
  // Smaller royal reception houses flank the main player entrance.
  { position: Vector3.create(24, 2.55, 59.1), rotationY: 0, scale: Vector3.create(6.2, 8, 6.2) },
  { position: Vector3.create(40, 2.55, 59.1), rotationY: 0, scale: Vector3.create(6.2, 8, 6.2) }
]

function addBuilding(model: string, placement: BuildingPlacement): void {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: placement.position,
    rotation: Quaternion.fromEulerDegrees(0, placement.rotationY, 0),
    scale: placement.scale
  })
  GltfContainer.create(entity, {
    src: model,
    visibleMeshesCollisionMask: ColliderLayer.CL_NONE,
    invisibleMeshesCollisionMask: ColliderLayer.CL_NONE
  })
}

export function createRoyalStadiumArchitecture(): void {
  for (const placement of GRANDSTANDS) addBuilding(GRANDSTAND_MODEL, placement)
  for (const placement of LODGES) addBuilding(LODGE_MODEL, placement)
  console.log(`[Horse Racing] royal stadium ready: ${GRANDSTANDS.length} grandstands, ${LODGES.length} lodges`)
}
