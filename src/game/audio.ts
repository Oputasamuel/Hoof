import { AudioSource, Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

const THEME_SONG = 'assets/Audio/hoof-theme.mp3'
const HOOFBEAT_LOOP = 'assets/Audio/hoofbeat-loop.mp3'
const JUMP_NEIGH = 'assets/Audio/horse-jump-neigh.mp3'
const CROWD_AMBIENCE = 'assets/Audio/crowd-ambience.mp3'
const FINISH_CHEER = 'assets/Audio/finish-crowd-cheer.mp3'
const UI_HOVER = 'assets/Audio/ui-hover.wav'
const UI_CLICK = 'assets/Audio/ui-click.wav'
const COUNTDOWN_BEEP = 'assets/Audio/countdown-beep.wav'
const COUNTDOWN_GO = 'assets/Audio/countdown-go.wav'
const THEME_VOLUME = .34

let themeEntity: Entity | undefined
let crowdEntity: Entity | undefined
let finishEntity: Entity | undefined
let uiHoverEntity: Entity | undefined
let uiClickEntity: Entity | undefined
let countdownEntity: Entity | undefined
let goEntity: Entity | undefined
let hoofEntity: Entity | undefined
let hoovesPlaying = false
const jumpEntities = new Map<number, Entity>()

export const audio = {
  initialize() {
    if (themeEntity !== undefined) return
    themeEntity = engine.addEntity()
    AudioSource.create(themeEntity, {
      audioClipUrl: THEME_SONG,
      playing: true,
      loop: true,
      volume: THEME_VOLUME,
      global: true
    })
    crowdEntity = engine.addEntity()
    AudioSource.create(crowdEntity, {
      audioClipUrl: CROWD_AMBIENCE,
      playing: false,
      loop: true,
      volume: 1,
      pitch: 1,
      global: true
    })
    finishEntity = engine.addEntity()
    AudioSource.create(finishEntity, {
      audioClipUrl: FINISH_CHEER,
      playing: false,
      loop: false,
      volume: .82,
      pitch: 1,
      global: true
    })
    uiHoverEntity = engine.addEntity()
    AudioSource.create(uiHoverEntity, {
      audioClipUrl: UI_HOVER,
      playing: false,
      loop: false,
      volume: .3,
      pitch: 1,
      global: true
    })
    uiClickEntity = engine.addEntity()
    AudioSource.create(uiClickEntity, {
      audioClipUrl: UI_CLICK,
      playing: false,
      loop: false,
      volume: .56,
      pitch: 1,
      global: true
    })
    countdownEntity = engine.addEntity()
    AudioSource.create(countdownEntity, {
      audioClipUrl: COUNTDOWN_BEEP,
      playing: false,
      loop: false,
      volume: .78,
      pitch: 1,
      global: true
    })
    goEntity = engine.addEntity()
    AudioSource.create(goEntity, {
      audioClipUrl: COUNTDOWN_GO,
      playing: false,
      loop: false,
      volume: .88,
      pitch: 1,
      global: true
    })
  },
  startRace() {
    if (themeEntity !== undefined) AudioSource.stopSound(themeEntity, true)
    if (crowdEntity !== undefined) AudioSource.playSound(crowdEntity, CROWD_AMBIENCE, true)
  },
  startMenu() {
    if (crowdEntity !== undefined) AudioSource.stopSound(crowdEntity, true)
    if (themeEntity !== undefined) AudioSource.playSound(themeEntity, THEME_SONG, true)
  },
  attachHorse(entity: Entity, horseId: number) {
    if (!jumpEntities.has(horseId)) {
      const jumpEntity = engine.addEntity()
      Transform.create(jumpEntity, { parent: entity, position: Vector3.Zero() })
      AudioSource.create(jumpEntity, {
        audioClipUrl: JUMP_NEIGH,
        playing: false,
        loop: false,
        volume: .72,
        pitch: .96 + horseId * .015,
        global: false
      })
      jumpEntities.set(horseId, jumpEntity)
    }
    if (horseId === 0 && hoofEntity === undefined) {
      hoofEntity = entity
      AudioSource.create(entity, {
        audioClipUrl: HOOFBEAT_LOOP,
        playing: false,
        loop: true,
        volume: .45,
        pitch: 1,
        global: false
      })
    }
  },
  onHover() {
    if (uiHoverEntity !== undefined) AudioSource.playSound(uiHoverEntity, UI_HOVER, true)
  },
  onPress() {
    if (uiClickEntity !== undefined) AudioSource.playSound(uiClickEntity, UI_CLICK, true)
  },
  countdown() {
    if (countdownEntity !== undefined) AudioSource.playSound(countdownEntity, COUNTDOWN_BEEP, true)
  },
  go() {
    if (goEntity !== undefined) AudioSource.playSound(goEntity, COUNTDOWN_GO, true)
  },
  boost() {},
  lap() {},
  finish() {
    if (finishEntity === undefined) return
    AudioSource.playSound(finishEntity, FINISH_CHEER, true)
  },
  jump(horseId: number) {
    const entity = jumpEntities.get(horseId)
    if (entity === undefined) return
    AudioSource.playSound(entity, JUMP_NEIGH, true)
  },
  updateHooves(speed: number) {
    if (hoofEntity === undefined) return
    const source = AudioSource.getMutable(hoofEntity)
    const running = speed > .7
    if (running !== hoovesPlaying) {
      source.playing = running
      hoovesPlaying = running
    }
    if (running) {
      const ratio = Math.max(0, Math.min(1, speed / 12.8))
      source.volume = .28 + ratio * .34
      source.pitch = .78 + ratio * .5
    }
  }
}
