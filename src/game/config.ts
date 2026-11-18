export type Difficulty = 'EASY' | 'NORMAL' | 'HARD'
export const GAME = { laps: 3, horseCount: 6, introSeconds: 5, countdownSeconds: 3, resultsDelay: 2, aiFinishTimeout: 10, failsafeSeconds: 300 } as const
export const HORSE_MODELS = [1, 2, 3, 4, 1, 2].map((n) => `assets/Models/Horses/horse-0${n}.glb`)
export const DRIVE = { cruiseSpeed: 9.5, boostSpeed: 12.8, acceleration: 6, braking: 6, sprintBlendIn: 1.15, sprintBlendOut: 2.4, steeringResponse: 9, lowSpeedYawRate: 100, highSpeedYawRate: 60, offTrackSpeedMultiplier: 0.55, offTrackBlendRate: 5, edgePushDistance: 3, edgePushRate: 1.8, separationDistance: 1.6, separationRate: 2.2, wrongWaySpeedCap: 5.5 } as const
export const STAMINA = { maximum: 100, drainPerSecond: 45, regenPerSecond: 14, lockBelow: 10, unlockAt: 30 } as const
export const JUMP = { velocity: 8.4, gravity: 15.5, clearHeight: 1.05, hitRadius: 2.05, penaltySpeed: 2.8 } as const
export const AI_PRESETS = {
  EASY: { min: 7.9, max: 9, rubberBand: .02, jumpReliability: .64, mistakeRate: .34, hesitation: .9 },
  NORMAL: { min: 8.8, max: 9.9, rubberBand: .04, jumpReliability: .78, mistakeRate: .22, hesitation: .55 },
  HARD: { min: 9.5, max: 10.6, rubberBand: .055, jumpReliability: .9, mistakeRate: .12, hesitation: .3 }
} as const
export const CAMERA = { near: { distance: 6.5, height: 3, lead: 3 }, far: { distance: 11, height: 5.5, lead: 5 }, countdown: { distance: 5.5, height: 2.4, lead: 0 }, targetHeight: 1.4, positionResponse: 8, targetResponse: 6, headingResponse: 7, fov: 64, boostDistance: 1.5, boostLead: 1, boundsPadding: .5 } as const
export const HORSE_VISUAL = { yawCorrectionDegrees: 0, scale: 1 } as const
export const UI = { holdFailsafeSeconds: 1.5, bannerSeconds: 1.5 } as const
