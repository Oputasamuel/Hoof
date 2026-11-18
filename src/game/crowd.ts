import {
  Billboard,
  BillboardMode,
  Entity,
  Material,
  MaterialTransparencyMode,
  MeshRenderer,
  Transform,
  engine
} from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { centerline, trackWidth } from '../track'
import { createAmbientHorses } from './ambientHorses'

const CROWD_TEXTURE = 'assets/Models/spectator-crowd.png'
const TAU = Math.PI * 2

interface CrowdCard {
  entity: Entity
  baseY: number
  width: number
  height: number
  phase: number
  speed: number
}

interface CheeringFan {
  root: Entity
  leftArm: Entity
  rightArm: Entity
  baseY: number
  phase: number
  speed: number
}

const cards: CrowdCard[] = []
const fans: CheeringFan[] = []
let initialized = false

const outfitColors = [
  Color4.create(.35, .05, .38, 1),
  Color4.create(.48, .08, .16, 1),
  Color4.create(.05, .32, .34, 1),
  Color4.create(.79, .55, .12, 1),
  Color4.create(.24, .12, .07, 1),
  Color4.create(.88, .72, .42, 1)
]
const skinColors = [
  Color4.create(.98, .77, .58, 1),
  Color4.create(.72, .43, .25, 1),
  Color4.create(.42, .22, .12, 1),
  Color4.create(.88, .60, .39, 1)
]

function seededRandom(seed = 0x51a7d1): () => number {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function addCrowdCard(position: Vector3, width: number, height: number, phase: number, speed: number): void {
  const entity = engine.addEntity()
  Transform.create(entity, { position, scale: Vector3.create(width, height, 1) })
  MeshRenderer.setPlane(entity)
  Billboard.create(entity, { billboardMode: BillboardMode.BM_Y })
  Material.setPbrMaterial(entity, {
    texture: Material.Texture.Common({ src: CROWD_TEXTURE }),
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    albedoColor: Color4.White(),
    emissiveColor: Color4.create(.08, .035, .015, 1),
    emissiveIntensity: .32,
    roughness: 1,
    metallic: 0,
    castShadows: false
  })
  cards.push({ entity, baseY: position.y, width, height, phase, speed })
}

function coloredPart(parent: Entity, position: Vector3, scale: Vector3, color: Color4, sphere = false): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { parent, position, scale })
  if (sphere) MeshRenderer.setSphere(entity)
  else MeshRenderer.setBox(entity)
  Material.setPbrMaterial(entity, { albedoColor: color, roughness: .82, metallic: .04 })
  return entity
}

function addCheeringFan(position: Vector3, outfit: Color4, skin: Color4, phase: number, speed: number): void {
  const root = engine.addEntity()
  Transform.create(root, { position, rotation: Quaternion.fromEulerDegrees(0, 180, 0) })
  coloredPart(root, Vector3.create(0, .82, 0), Vector3.create(.48, .68, .28), outfit)
  coloredPart(root, Vector3.create(0, 1.52, 0), Vector3.create(.32, .32, .32), skin, true)
  const leftArm = coloredPart(root, Vector3.create(-.38, 1.08, 0), Vector3.create(.14, .62, .14), skin)
  const rightArm = coloredPart(root, Vector3.create(.38, 1.08, 0), Vector3.create(.14, .62, .14), skin)
  fans.push({ root, leftArm, rightArm, baseY: position.y, phase, speed })
}

function populateGrandstand(random: () => number): void {
  const tiers = [
    { z: 2.45, floorY: 1.02, height: 2.28 },
    { z: 3.9, floorY: 1.70, height: 2.2 },
    { z: 5.35, floorY: 2.40, height: 2.08 },
    { z: 6.75, floorY: 3.08, height: 1.98 },
    { z: 8.05, floorY: 3.72, height: 1.88 }
  ]
  for (const tier of tiers) {
    for (let x = 14.5; x <= 49.5; x += 2.8) {
      const height = tier.height * (.95 + random() * .08)
      addCrowdCard(
        Vector3.create(x + (random() - .5) * .25, tier.floorY + height * .5, tier.z),
        4.15,
        height,
        random() * TAU,
        3.8 + random() * 2.2
      )
    }
  }

  for (let i = 0; i < 60; i++) {
    const row = i % 5
    addCheeringFan(
      Vector3.create(14.8 + (i % 13) * 2.75, 1.03 + row * .67, 2.05 + row * 1.34 + Math.floor(i / 13) * .1),
      outfitColors[i % outfitColors.length],
      skinColors[(i * 3) % skinColors.length],
      random() * TAU,
      3.4 + random() * 2.8
    )
  }
}

function populateTrackside(random: () => number): void {
  const offset = trackWidth / 2 + 2.35
  for (let i = 0; i < centerline.length; i++) {
    const point = centerline[i]
    if (point.z > 44.5) continue
    const next = centerline[(i + 1) % centerline.length]
    const dx = next.x - point.x
    const dz = next.z - point.z
    const length = Math.hypot(dx, dz) || 1
    const rightX = dz / length
    const rightZ = -dx / length
    const height = 1.82 + random() * .18
    for (const side of [-1, 1]) addCrowdCard(
      Vector3.create(point.x + rightX * offset * side, .22 + height * .5, point.z + rightZ * offset * side),
      3.75 + random() * .3, height, random() * TAU, 3.5 + random() * 2.5
    )
  }
}

function populateStadiumBowl(random: () => number): void {
  const addBand = (horizontal: boolean, fixed: number, start: number, end: number, tier: number) => {
    for (let value = start; value <= end; value += 3.15) {
      const height = 1.82 + random() * .22
      const x = horizontal ? value : fixed
      const z = horizontal ? fixed : value
      addCrowdCard(
        Vector3.create(x + (random() - .5) * .18, .55 + tier * .72 + height * .5, z + (random() - .5) * .18),
        4.25, height, random() * TAU, 3.2 + random() * 2.8
      )
    }
  }
  for (let tier = 0; tier < 3; tier++) {
    addBand(true, 2.0 + tier * 1.15, 5.5, 58.5, tier)
    addBand(true, 62.0 - tier * 1.15, 5.5, 58.5, tier)
    addBand(false, 2.0 + tier * 1.15, 8.0, 56.0, tier)
    addBand(false, 62.0 - tier * 1.15, 8.0, 56.0, tier)
  }
}

function animateCrowd(dt: number): void {
  crowdTime += Math.min(dt, .05)
  for (const card of cards) {
    const wave = Math.sin(crowdTime * card.speed + card.phase)
    const transform = Transform.getMutable(card.entity)
    transform.position = Vector3.create(transform.position.x, card.baseY + Math.max(0, wave) * .055, transform.position.z)
    transform.scale = Vector3.create(card.width * (1 + Math.max(0, wave) * .008), card.height * (1 + Math.max(0, wave) * .018), 1)
  }
  for (const fan of fans) {
    const wave = Math.sin(crowdTime * fan.speed + fan.phase)
    const root = Transform.getMutable(fan.root)
    root.position = Vector3.create(root.position.x, fan.baseY + Math.max(0, wave) * .11, root.position.z)
    Transform.getMutable(fan.leftArm).rotation = Quaternion.fromEulerDegrees(0, 0, 28 + wave * 42)
    Transform.getMutable(fan.rightArm).rotation = Quaternion.fromEulerDegrees(0, 0, -28 - wave * 42)
  }
}

let crowdTime = 0

export function createSpectatorCrowd(): void {
  if (initialized) return
  initialized = true
  const random = seededRandom()
  populateGrandstand(random)
  populateTrackside(random)
  populateStadiumBowl(random)
  createAmbientHorses()
  engine.addSystem(animateCrowd)
  console.log(`[Horse Racing] cheering crowd ready: ${cards.length * 12 + fans.length} spectators`)
}
