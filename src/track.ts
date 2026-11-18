import { Entity, Material, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

/**
 * Golden Hour Racecourse geometry data.
 *
 * Coordinates are metres in Decentraland's right-handed world space (Y up).
 * The start/finish line is on the south straight. Forward at the start is west
 * (-X), and the ordered centerline runs clockwise.
 *
 * Curve points are spaced at roughly 3.5 m. Straight samples use similar
 * spacing, which is dense enough for smooth 10 m/s steering without producing
 * an unnecessarily large waypoint array.
 */

export interface StartSlot {
  index: number
  position: Vector3
  rotation: Quaternion
}

export interface FinishLineData {
  center: Vector3
  width: number
  direction: Vector3
}

export interface CheckpointData {
  index: number
  center: Vector3
  size: Vector3
}

export interface TrackBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface ZoneData {
  position: Vector3
  size: Vector3
}

export interface LobbySpawnData {
  position: Vector3
  lookAt: Vector3
}

export const trackWidth = 8.5
export const cameraClearance = 6

const CURVE_RADIUS = 14
const LEFT_CURVE_X = 24.25
const RIGHT_CURVE_X = 39.75
const CENTER_Z = 32
const SOUTH_Z = CENTER_Z + CURVE_RADIUS
const NORTH_Z = CENTER_Z - CURVE_RADIUS
const SAMPLE_SPACING = 3.5

function appendLine(points: Vector3[], fromX: number, fromZ: number, toX: number, toZ: number, includeStart: boolean) {
  const distance = Math.hypot(toX - fromX, toZ - fromZ)
  const steps = Math.max(1, Math.ceil(distance / SAMPLE_SPACING))
  for (let i = includeStart ? 0 : 1; i <= steps; i++) {
    const t = i / steps
    points.push(Vector3.create(fromX + (toX - fromX) * t, 0.22, fromZ + (toZ - fromZ) * t))
  }
}

function appendArc(points: Vector3[], cx: number, cz: number, startAngle: number, endAngle: number) {
  const arcLength = Math.abs(endAngle - startAngle) * CURVE_RADIUS
  const steps = Math.max(2, Math.ceil(arcLength / SAMPLE_SPACING))
  for (let i = 1; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps)
    points.push(Vector3.create(cx + Math.cos(angle) * CURVE_RADIUS, 0.22, cz + Math.sin(angle) * CURVE_RADIUS))
  }
}

function buildCenterline(): Vector3[] {
  const points: Vector3[] = []
  appendLine(points, 32, SOUTH_Z, LEFT_CURVE_X, SOUTH_Z, true)
  appendArc(points, LEFT_CURVE_X, CENTER_Z, Math.PI / 2, Math.PI * 1.5)
  appendLine(points, LEFT_CURVE_X, NORTH_Z, RIGHT_CURVE_X, NORTH_Z, false)
  appendArc(points, RIGHT_CURVE_X, CENTER_Z, -Math.PI / 2, Math.PI / 2)
  appendLine(points, RIGHT_CURVE_X, SOUTH_Z, 32, SOUTH_Z, false)
  // The helper closes the loop implicitly (last -> first), so keep the finish
  // waypoint only once and avoid a zero-length segment at the wrap.
  points.pop()
  return points
}

export const centerline: Vector3[] = buildCenterline()

function loopLength(points: Vector3[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    total += Math.hypot(b.x - a.x, b.z - a.z)
  }
  return total
}

export const trackLength = loopLength(centerline)

const START_ROTATION = Quaternion.fromEulerDegrees(0, -90, 0)

export const startSlots: StartSlot[] = [
  { index: 1, position: Vector3.create(34.5, 0.28, 43.5), rotation: START_ROTATION },
  { index: 2, position: Vector3.create(34.5, 0.28, 46.0), rotation: START_ROTATION },
  { index: 3, position: Vector3.create(34.5, 0.28, 48.5), rotation: START_ROTATION },
  { index: 4, position: Vector3.create(38.0, 0.28, 43.5), rotation: START_ROTATION },
  { index: 5, position: Vector3.create(38.0, 0.28, 46.0), rotation: START_ROTATION },
  { index: 6, position: Vector3.create(38.0, 0.28, 48.5), rotation: START_ROTATION }
]

export const finishLine: FinishLineData = {
  center: Vector3.create(32, 0.24, SOUTH_Z),
  width: trackWidth,
  direction: Vector3.create(-1, 0, 0)
}

export const checkpoints: CheckpointData[] = [
  { index: 1, center: Vector3.create(LEFT_CURVE_X - CURVE_RADIUS, 1.5, CENTER_Z), size: Vector3.create(3, 3, 11) },
  { index: 2, center: Vector3.create(32, 1.5, NORTH_Z), size: Vector3.create(11, 3, 3) },
  { index: 3, center: Vector3.create(RIGHT_CURVE_X + CURVE_RADIUS, 1.5, CENTER_Z), size: Vector3.create(3, 3, 11) },
  { index: 4, center: Vector3.create(39, 1.5, SOUTH_Z), size: Vector3.create(8, 3, 3) }
]

export const trackBounds: TrackBounds = {
  minX: LEFT_CURVE_X - CURVE_RADIUS - trackWidth / 2,
  maxX: RIGHT_CURVE_X + CURVE_RADIUS + trackWidth / 2,
  minZ: NORTH_Z - trackWidth / 2,
  maxZ: SOUTH_Z + trackWidth / 2
}

export const hideZone: ZoneData = {
  position: Vector3.create(3, 2, 60),
  size: Vector3.create(4, 4, 4)
}

export const lobbySpawn: LobbySpawnData = {
  position: Vector3.create(32, 0.3, 61),
  lookAt: Vector3.create(32, 1.5, 50)
}

export const pickupCandidates: Vector3[] = [
  Vector3.create(20, 0.35, SOUTH_Z),
  Vector3.create(12, 0.35, 39),
  Vector3.create(12, 0.35, 25),
  Vector3.create(27, 0.35, NORTH_Z),
  Vector3.create(37, 0.35, NORTH_Z),
  Vector3.create(52, 0.35, 25),
  Vector3.create(52, 0.35, 39),
  Vector3.create(44, 0.35, SOUTH_Z)
]

interface ProjectionResult {
  segmentIndex: number
  segmentT: number
  x: number
  z: number
  distance: number
  distanceAlong: number
}

function nearestProjection(position: Vector3): ProjectionResult {
  let best: ProjectionResult = {
    segmentIndex: 0,
    segmentT: 0,
    x: centerline[0].x,
    z: centerline[0].z,
    distance: Number.POSITIVE_INFINITY,
    distanceAlong: 0
  }
  let accumulated = 0

  for (let i = 0; i < centerline.length; i++) {
    const a = centerline[i]
    const b = centerline[(i + 1) % centerline.length]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const lengthSquared = dx * dx + dz * dz
    const segmentLength = Math.sqrt(lengthSquared)
    const rawT = lengthSquared > 0 ? ((position.x - a.x) * dx + (position.z - a.z) * dz) / lengthSquared : 0
    const t = Math.max(0, Math.min(1, rawT))
    const x = a.x + dx * t
    const z = a.z + dz * t
    const distance = Math.hypot(position.x - x, position.z - z)

    if (distance < best.distance) {
      best = { segmentIndex: i, segmentT: t, x, z, distance, distanceAlong: accumulated + segmentLength * t }
    }
    accumulated += segmentLength
  }
  return best
}

/**
 * Returns normalized lap progress in [0, 1). Example:
 * `progressAt(finishLine.center) === 0` (within floating-point tolerance).
 */
export function progressAt(position: Vector3): number {
  const progress = nearestProjection(position).distanceAlong / trackLength
  return ((progress % 1) + 1) % 1
}

/**
 * Signed distance from the closest centerline segment. Positive means the
 * point lies to the horse's right while travelling in the centerline order.
 * Example: on the westbound start straight, larger Z values are positive.
 */
export function lateralOffsetAt(position: Vector3): number {
  const projection = nearestProjection(position)
  const a = centerline[projection.segmentIndex]
  const b = centerline[(projection.segmentIndex + 1) % centerline.length]
  const dx = b.x - a.x
  const dz = b.z - a.z
  const length = Math.hypot(dx, dz) || 1
  const rightX = dz / length
  const rightZ = -dx / length
  return (position.x - projection.x) * rightX + (position.z - projection.z) * rightZ
}

/** Returns true when the point is between the two visual track edges. */
export function isOnTrack(position: Vector3): boolean {
  return Math.abs(lateralOffsetAt(position)) <= trackWidth / 2
}

/** Keeps custom-driven horses inside the visible wooden rail line. */
export function constrainToTrack(position: Vector3, inset = 0.55): Vector3 {
  const projection = nearestProjection(position)
  const a = centerline[projection.segmentIndex]
  const b = centerline[(projection.segmentIndex + 1) % centerline.length]
  const dx = b.x - a.x
  const dz = b.z - a.z
  const length = Math.hypot(dx, dz) || 1
  const rightX = dz / length
  const rightZ = -dx / length
  const lateral = (position.x - projection.x) * rightX + (position.z - projection.z) * rightZ
  const limit = Math.max(0.5, trackWidth / 2 - inset)
  const clamped = Math.max(-limit, Math.min(limit, lateral))
  if (clamped === lateral) return position
  return Vector3.create(projection.x + rightX * clamped, position.y, projection.z + rightZ * clamped)
}

// Toggle only during authoring. Disabled markers create zero final entities.
export const DEBUG_TRACK_MARKERS = false
let debugEntities: Entity[] = []

function marker(position: Vector3, color: Color4, scale = Vector3.create(0.24, 0.24, 0.24)): Entity {
  const entity = engine.addEntity()
  debugEntities.push(entity)
  Transform.create(entity, { position, scale })
  MeshRenderer.setSphere(entity)
  Material.setPbrMaterial(entity, { albedoColor: color, emissiveColor: color, emissiveIntensity: 2 })
  return entity
}

/** Spawn fully removable authoring markers. Call only when DEBUG_TRACK_MARKERS is true. */
export function spawnTrackDebugMarkers(): Entity[] {
  removeTrackDebugMarkers()
  centerline.forEach((point) => marker(point, Color4.create(0.2, 0.8, 1, 1)))
  startSlots.forEach((slot) => marker(slot.position, Color4.create(1, 0.75, 0.1, 1), Vector3.create(0.4, 0.4, 0.4)))
  checkpoints.forEach((checkpoint) => marker(checkpoint.center, Color4.create(0.8, 0.2, 1, 1), Vector3.create(0.7, 0.7, 0.7)))
  marker(finishLine.center, Color4.create(1, 1, 1, 1), Vector3.create(0.6, 0.6, 0.6))
  marker(hideZone.position, Color4.create(1, 0.1, 0.1, 1), Vector3.create(0.8, 0.8, 0.8))
  pickupCandidates.forEach((point) => marker(point, Color4.create(1, 0.45, 0.05, 1), Vector3.create(0.32, 0.32, 0.32)))
  return [...debugEntities]
}

/** Remove every marker previously created by spawnTrackDebugMarkers(). */
export function removeTrackDebugMarkers(): void {
  for (const entity of debugEntities) engine.removeEntity(entity)
  debugEntities = []
}

