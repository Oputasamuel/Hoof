import { Difficulty } from './config'
import { gameEvents } from './events'
import { gameState } from './state'

export type TaskTier = 'EASY' | 'MEDIUM' | 'HARD'

export interface DailyTaskDefinition {
  id: string
  title: string
  metric: string
  target: number
  points: number
  tier: TaskTier
}

export interface DailyTaskView extends DailyTaskDefinition {
  progress: number
  complete: boolean
}

export interface SavedDailyState {
  dateKey: string
  progress: Record<string, number>
  claimed: Record<string, boolean>
}

const tierPoints = (tier: TaskTier, target: number) => {
  if (tier === 'EASY') return Math.min(120, 45 + target * 7)
  if (tier === 'MEDIUM') return Math.min(260, 125 + target * 9)
  return Math.min(520, 260 + target * 12)
}

const task = (id: string, title: string, metric: string, target: number, tier: TaskTier): DailyTaskDefinition => ({
  id, title, metric, target, tier, points: tierPoints(tier, target)
})

function plural(value: number, one: string, many = `${one}S`) { return value === 1 ? one : many }

function buildTaskBank(): DailyTaskDefinition[] {
  const bank: DailyTaskDefinition[] = []

  for (let n = 1; n <= 20; n++) {
    const tier: TaskTier = n <= 3 ? 'EASY' : n <= 8 ? 'MEDIUM' : 'HARD'
    bank.push(task(`finish-${n}`, `COMPLETE ${n} ${plural(n, 'RACE')}`, 'races', n, tier))
  }
  for (let n = 1; n <= 10; n++) {
    const tier: TaskTier = n <= 2 ? 'MEDIUM' : n <= 5 ? 'HARD' : 'HARD'
    bank.push(task(`wins-${n}`, `FINISH 1ST IN ${n} ${plural(n, 'RACE')}`, 'wins', n, tier))
  }
  for (let n = 1; n <= 10; n++) {
    const tier: TaskTier = n <= 3 ? 'EASY' : n <= 7 ? 'MEDIUM' : 'HARD'
    bank.push(task(`not-last-${n}`, `AVOID LAST PLACE ${n} ${plural(n, 'TIME')}`, 'not_last', n, tier))
  }
  for (let n = 1; n <= 10; n++) {
    const tier: TaskTier = n <= 2 ? 'EASY' : n <= 6 ? 'MEDIUM' : 'HARD'
    bank.push(task(`top3-${n}`, `FINISH TOP 3 IN ${n} ${plural(n, 'RACE')}`, 'top3', n, tier))
  }
  for (let n = 1; n <= 8; n++) {
    const tier: TaskTier = n <= 2 ? 'MEDIUM' : n <= 5 ? 'MEDIUM' : 'HARD'
    bank.push(task(`top2-${n}`, `FINISH TOP 2 IN ${n} ${plural(n, 'RACE')}`, 'top2', n, tier))
  }
  for (const n of [1, 2, 3, 5, 8, 10, 15, 20, 25, 30]) {
    const tier: TaskTier = n <= 3 ? 'EASY' : n <= 10 ? 'MEDIUM' : 'HARD'
    bank.push(task(`jumps-${n}`, `CLEAR ${n} ${plural(n, 'HURDLE')}`, 'jumps', n, tier))
  }
  for (const n of [3, 6, 9, 12, 18, 24, 30, 36]) {
    const tier: TaskTier = n <= 6 ? 'EASY' : n <= 18 ? 'MEDIUM' : 'HARD'
    bank.push(task(`laps-${n}`, `COMPLETE ${n} ${plural(n, 'LAP')}`, 'laps', n, tier))
  }
  for (const n of [1, 2, 3, 5, 7, 10]) {
    const tier: TaskTier = n === 1 ? 'MEDIUM' : n <= 3 ? 'MEDIUM' : 'HARD'
    bank.push(task(`clean-${n}`, `FINISH ${n} CLEAN ${plural(n, 'RACE')}`, 'clean_races', n, tier))
  }
  for (const difficulty of ['EASY', 'NORMAL', 'HARD'] as Difficulty[]) {
    for (const n of [1, 3]) {
      const tier: TaskTier = difficulty === 'EASY' && n === 1 ? 'EASY' : difficulty === 'HARD' ? 'HARD' : 'MEDIUM'
      bank.push(task(`finish-${difficulty.toLowerCase()}-${n}`, `FINISH ${n} ${difficulty} ${plural(n, 'RACE')}`, `finish_${difficulty.toLowerCase()}`, n, tier))
    }
  }
  for (const difficulty of ['EASY', 'NORMAL', 'HARD'] as Difficulty[]) {
    for (const n of [1, 2]) {
      const tier: TaskTier = difficulty === 'HARD' || n === 2 ? 'HARD' : 'MEDIUM'
      bank.push(task(`win-${difficulty.toLowerCase()}-${n}`, `WIN ${n} ${plural(n, 'RACE')} ON ${difficulty}`, `win_${difficulty.toLowerCase()}`, n, tier))
    }
  }
  for (const seconds of [75, 65, 58, 52, 48, 44]) {
    const tier: TaskTier = seconds >= 65 ? 'EASY' : seconds >= 52 ? 'MEDIUM' : 'HARD'
    bank.push(task(`speed-${seconds}`, `FINISH A RACE UNDER ${seconds} SECONDS`, `finish_under_${seconds}`, 1, tier))
  }

  if (bank.length !== 100) throw new Error(`Daily task bank must contain 100 tasks, found ${bank.length}`)
  return bank
}

export const DAILY_TASK_BANK = buildTaskBank()

function dateKey() { return new Date().toISOString().slice(0, 10) }

function hash(text: string) {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619)
  return value >>> 0
}

function randomForDay(day: string) {
  let seed = hash(`HOOF-${day}`)
  return () => {
    seed += 0x6d2b79f5
    let t = seed
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const value = result[i]
    result[i] = result[j]
    result[j] = value
  }
  return result
}

function selectDaily(day: string) {
  const random = randomForDay(day)
  const easy = shuffle(DAILY_TASK_BANK.filter(x => x.tier === 'EASY'), random).slice(0, 8)
  const medium = shuffle(DAILY_TASK_BANK.filter(x => x.tier === 'MEDIUM'), random).slice(0, 7)
  const hard = shuffle(DAILY_TASK_BANK.filter(x => x.tier === 'HARD'), random).slice(0, 5)
  return shuffle([...easy, ...medium, ...hard], random)
}

function load(day: string): SavedDailyState {
  try {
    const storage = (globalThis as any).localStorage
    const raw = storage?.getItem('hoof-daily-tasks')
    if (raw) {
      const saved = JSON.parse(raw) as SavedDailyState
      if (saved.dateKey === day) return saved
    }
  } catch {}
  return { dateKey: day, progress: {}, claimed: {} }
}

function save() {
  try { (globalThis as any).localStorage?.setItem('hoof-daily-tasks', JSON.stringify(savedState)) } catch {}
}

let currentDay = dateKey()
let selectedTasks = selectDaily(currentDay)
let savedState = load(currentDay)
function loadLeaderboardPoints() {
  try {
    const storage = (globalThis as any).localStorage
    const raw = storage?.getItem('hoof-leaderboard-points')
    if (raw !== undefined && raw !== null) return Math.max(0, Number(raw) || 0)
  } catch {}
  return selectedTasks.reduce((total, definition) => total + (savedState.claimed[definition.id] ? definition.points : 0), 0)
}
let leaderboardPoints = loadLeaderboardPoints()
let raceWasClean = true
let initialized = false

export type DailyPersistenceState = {
  dateKey: string
  progress: Record<string, number>
  claimed: Record<string, boolean>
  leaderboardPoints: number
}

export function exportDailyState(): DailyPersistenceState {
  refreshDay()
  return {
    dateKey: savedState.dateKey,
    progress: { ...savedState.progress },
    claimed: { ...savedState.claimed },
    leaderboardPoints
  }
}

export function hydrateDailyState(value: Partial<DailyPersistenceState> | undefined) {
  if (!value) return
  const today = dateKey()
  const savedDay = typeof value.dateKey === 'string' ? value.dateKey : today
  currentDay = today
  selectedTasks = selectDaily(today)
  savedState = savedDay === today ? {
    dateKey: today,
    progress: value.progress && typeof value.progress === 'object' ? { ...value.progress } : {},
    claimed: value.claimed && typeof value.claimed === 'object' ? { ...value.claimed } : {}
  } : { dateKey: today, progress: {}, claimed: {} }
  leaderboardPoints = Math.max(0, Math.min(100000000, Math.floor(Number(value.leaderboardPoints) || 0)))
  save()
  saveLeaderboardPoints()
}

function saveLeaderboardPoints() {
  try { (globalThis as any).localStorage?.setItem('hoof-leaderboard-points', String(leaderboardPoints)) } catch {}
}

function refreshDay() {
  const nextDay = dateKey()
  if (nextDay === currentDay) return
  currentDay = nextDay
  selectedTasks = selectDaily(currentDay)
  savedState = load(currentDay)
}

function addProgress(metric: string, amount = 1) {
  refreshDay()
  for (const definition of selectedTasks) {
    if (definition.metric !== metric || savedState.claimed[definition.id]) continue
    const previous = savedState.progress[definition.id] ?? 0
    const progress = Math.min(definition.target, previous + amount)
    savedState.progress[definition.id] = progress
    if (progress >= definition.target) {
      savedState.claimed[definition.id] = true
      leaderboardPoints += definition.points
      saveLeaderboardPoints()
      gameEvents.emit('taskCompleted', { taskId: definition.id, title: definition.title, points: definition.points })
    }
  }
  save()
}

export function getDailyTaskViews(): DailyTaskView[] {
  refreshDay()
  return selectedTasks.map(definition => ({
    ...definition,
    progress: Math.min(definition.target, savedState.progress[definition.id] ?? 0),
    complete: !!savedState.claimed[definition.id]
  }))
}

export function getDailyPoints() {
  refreshDay()
  return selectedTasks.reduce((total, definition) => total + (savedState.claimed[definition.id] ? definition.points : 0), 0)
}

export function getLeaderboardPoints() { return leaderboardPoints }

export function getDailyCompleted() { return getDailyTaskViews().filter(x => x.complete).length }
export function getDailyDate() { refreshDay(); return currentDay }

export function initializeDailyTasks() {
  if (initialized) return
  initialized = true
  gameEvents.on('raceStarted', () => { raceWasClean = true })
  gameEvents.on('offTrackEntered', event => { if (event.horseId === 0) raceWasClean = false })
  gameEvents.on('wrongWayStarted', event => { if (event.horseId === 0) raceWasClean = false })
  gameEvents.on('obstacleCleared', event => { if (event.horseId === 0) addProgress('jumps') })
  gameEvents.on('lapCompleted', event => { if (event.horseId === 0) addProgress('laps') })
  gameEvents.on('raceFinished', ({ results }) => {
    const player = results.find(x => x.horseId === 0)
    if (!player?.time) return
    addProgress('races')
    if (player.place === 1) addProgress('wins')
    if (player.place < results.length) addProgress('not_last')
    if (player.place <= 3) addProgress('top3')
    if (player.place <= 2) addProgress('top2')
    if (raceWasClean) addProgress('clean_races')
    addProgress(`finish_${gameState.difficulty.toLowerCase()}`)
    if (player.place === 1) addProgress(`win_${gameState.difficulty.toLowerCase()}`)
    for (const seconds of [75, 65, 58, 52, 48, 44]) if (player.time <= seconds) addProgress(`finish_under_${seconds}`)
  })
}
