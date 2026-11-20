'use strict'

const HORSES = {
  ember: { price: 0 },
  moonlight: { price: 500, calendarDay: 7 },
  nightfall: { price: 1500, calendarDay: 14 },
  sunfire: { price: 0, calendarDay: 28 }
}
const SPEED_TARGETS = [75, 65, 58, 52, 48, 44]

function integer(value, max) { return Math.max(0, Math.min(max, Math.floor(Number(value) || 0))) }
function dateKey(date = new Date()) { return date.toISOString().slice(0, 10) }
function cleanName(value, max = 40) { return typeof value === 'string' ? value.replace(/[<>]/g, '').trim().slice(0, max) : '' }
function tierPoints(tier, target) {
  if (tier === 'EASY') return Math.min(120, 45 + target * 7)
  if (tier === 'MEDIUM') return Math.min(260, 125 + target * 9)
  return Math.min(520, 260 + target * 12)
}
function task(id, title, metric, target, tier) { return { id, title, metric, target, tier, points: tierPoints(tier, target) } }
function plural(value, one, many = `${one}S`) { return value === 1 ? one : many }

function buildTaskBank() {
  const bank = []
  for (let n = 1; n <= 20; n++) bank.push(task(`finish-${n}`, `COMPLETE ${n} ${plural(n, 'RACE')}`, 'races', n, n <= 3 ? 'EASY' : n <= 8 ? 'MEDIUM' : 'HARD'))
  for (let n = 1; n <= 10; n++) bank.push(task(`wins-${n}`, `FINISH 1ST IN ${n} ${plural(n, 'RACE')}`, 'wins', n, n <= 2 ? 'MEDIUM' : 'HARD'))
  for (let n = 1; n <= 10; n++) bank.push(task(`not-last-${n}`, `AVOID LAST PLACE ${n} ${plural(n, 'TIME')}`, 'not_last', n, n <= 3 ? 'EASY' : n <= 7 ? 'MEDIUM' : 'HARD'))
  for (let n = 1; n <= 10; n++) bank.push(task(`top3-${n}`, `FINISH TOP 3 IN ${n} ${plural(n, 'RACE')}`, 'top3', n, n <= 2 ? 'EASY' : n <= 6 ? 'MEDIUM' : 'HARD'))
  for (let n = 1; n <= 8; n++) bank.push(task(`top2-${n}`, `FINISH TOP 2 IN ${n} ${plural(n, 'RACE')}`, 'top2', n, n <= 2 ? 'MEDIUM' : n <= 5 ? 'MEDIUM' : 'HARD'))
  for (const n of [1, 2, 3, 5, 8, 10, 15, 20, 25, 30]) bank.push(task(`jumps-${n}`, `CLEAR ${n} ${plural(n, 'HURDLE')}`, 'jumps', n, n <= 3 ? 'EASY' : n <= 10 ? 'MEDIUM' : 'HARD'))
  for (const n of [3, 6, 9, 12, 18, 24, 30, 36]) bank.push(task(`laps-${n}`, `COMPLETE ${n} ${plural(n, 'LAP')}`, 'laps', n, n <= 6 ? 'EASY' : n <= 18 ? 'MEDIUM' : 'HARD'))
  for (const n of [1, 2, 3, 5, 7, 10]) bank.push(task(`clean-${n}`, `FINISH ${n} CLEAN ${plural(n, 'RACE')}`, 'clean_races', n, n === 1 ? 'MEDIUM' : n <= 3 ? 'MEDIUM' : 'HARD'))
  for (const difficulty of ['EASY', 'NORMAL', 'HARD']) for (const n of [1, 3]) bank.push(task(`finish-${difficulty.toLowerCase()}-${n}`, `FINISH ${n} ${difficulty} ${plural(n, 'RACE')}`, `finish_${difficulty.toLowerCase()}`, n, difficulty === 'EASY' && n === 1 ? 'EASY' : difficulty === 'HARD' ? 'HARD' : 'MEDIUM'))
  for (const difficulty of ['EASY', 'NORMAL', 'HARD']) for (const n of [1, 2]) bank.push(task(`win-${difficulty.toLowerCase()}-${n}`, `WIN ${n} ${plural(n, 'RACE')} ON ${difficulty}`, `win_${difficulty.toLowerCase()}`, n, difficulty === 'HARD' || n === 2 ? 'HARD' : 'MEDIUM'))
  for (const seconds of SPEED_TARGETS) bank.push(task(`speed-${seconds}`, `FINISH A RACE UNDER ${seconds} SECONDS`, `finish_under_${seconds}`, 1, seconds >= 65 ? 'EASY' : seconds >= 52 ? 'MEDIUM' : 'HARD'))
  if (bank.length !== 100) throw new Error(`Task bank must contain 100 tasks, found ${bank.length}`)
  return bank
}

const TASK_BANK = buildTaskBank()
function hash(text) { let value = 2166136261; for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619); return value >>> 0 }
function randomForDay(day) { let seed = hash(`HOOF-${day}`); return () => { seed += 0x6d2b79f5; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function shuffle(items, random) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] } return result }
function selectDaily(day) { const random = randomForDay(day); const easy = shuffle(TASK_BANK.filter(x => x.tier === 'EASY'), random).slice(0, 8); const medium = shuffle(TASK_BANK.filter(x => x.tier === 'MEDIUM'), random).slice(0, 7); const hard = shuffle(TASK_BANK.filter(x => x.tier === 'HARD'), random).slice(0, 5); return shuffle([...easy, ...medium, ...hard], random) }

function defaultState() {
  return {
    economy: { horseshoes: 250, stableXp: 0, ownedHorses: ['ember'], equippedHorse: 'ember', calendarDay: 0, calendarCycle: 1, lastClaimDate: '' },
    daily: { dateKey: dateKey(), progress: {}, claimed: {}, leaderboardPoints: 0 }
  }
}

function sanitizeState(value) {
  const base = defaultState(), economy = value && typeof value.economy === 'object' ? value.economy : {}, daily = value && typeof value.daily === 'object' ? value.daily : {}
  const owned = Array.isArray(economy.ownedHorses) ? [...new Set(economy.ownedHorses.filter(id => HORSES[id]))] : ['ember']
  if (!owned.includes('ember')) owned.unshift('ember')
  const progress = {}, claimed = {}
  if (daily.progress && typeof daily.progress === 'object') for (const [key, amount] of Object.entries(daily.progress).slice(0, 100)) progress[cleanName(key, 64)] = integer(amount, 1000)
  if (daily.claimed && typeof daily.claimed === 'object') for (const [key, complete] of Object.entries(daily.claimed).slice(0, 100)) if (complete) claimed[cleanName(key, 64)] = true
  return {
    economy: {
      horseshoes: integer(economy.horseshoes, 1000000), stableXp: integer(economy.stableXp, 10000000), ownedHorses: owned,
      equippedHorse: owned.includes(economy.equippedHorse) ? economy.equippedHorse : 'ember', calendarDay: integer(economy.calendarDay, 27),
      calendarCycle: Math.max(1, integer(economy.calendarCycle, 100000)), lastClaimDate: /^\d{4}-\d{2}-\d{2}$/.test(economy.lastClaimDate || '') ? economy.lastClaimDate : ''
    },
    daily: { dateKey: /^\d{4}-\d{2}-\d{2}$/.test(daily.dateKey || '') ? daily.dateKey : base.daily.dateKey, progress, claimed, leaderboardPoints: integer(daily.leaderboardPoints, 100000000) }
  }
}

function ensureToday(state, now = new Date()) {
  const today = dateKey(now)
  if (state.daily.dateKey !== today) state.daily = { dateKey: today, progress: {}, claimed: {}, leaderboardPoints: state.daily.leaderboardPoints }
  return today
}

function rewardForDay(day) {
  const horseId = Object.keys(HORSES).find(id => HORSES[id].calendarDay === day)
  if (horseId) return { day, horseshoes: 100 + day * 10, stableXp: 80 + day * 5, horseId }
  const milestone = day % 7 === 0
  return { day, horseshoes: milestone ? 350 : 70 + day * 8, stableXp: milestone ? 180 : 35 + day * 3 }
}

function claimDaily(state, now = new Date()) {
  const today = dateKey(now)
  if (state.economy.lastClaimDate === today) return { claimed: false, state, message: 'TODAY’S REWARD HAS ALREADY BEEN CLAIMED' }
  const reward = rewardForDay(state.economy.calendarDay + 1)
  state.economy.horseshoes += reward.horseshoes
  state.economy.stableXp += reward.stableXp
  let horseMessage = ''
  if (reward.horseId) {
    if (state.economy.ownedHorses.includes(reward.horseId)) { state.economy.horseshoes += 500; horseMessage = ' • DUPLICATE +500 HORSESHOES' }
    else { state.economy.ownedHorses.push(reward.horseId); horseMessage = ` • UNLOCKED ${reward.horseId.toUpperCase()}` }
  }
  state.economy.lastClaimDate = today
  state.economy.calendarDay++
  if (state.economy.calendarDay >= 28) { state.economy.calendarDay = 0; state.economy.calendarCycle++ }
  return { claimed: true, state, reward, message: `DAY ${reward.day}: +${reward.horseshoes} HORSESHOES • +${reward.stableXp} XP${horseMessage}` }
}

function purchaseHorse(state, horseId) {
  const horse = HORSES[horseId]
  if (!horse || !horse.price || state.economy.ownedHorses.includes(horseId) || state.economy.horseshoes < horse.price) return { ok: false, state, message: 'HORSE CANNOT BE UNLOCKED' }
  state.economy.horseshoes -= horse.price
  state.economy.ownedHorses.push(horseId)
  return { ok: true, state, message: `${horseId.toUpperCase()} JOINED YOUR STABLE` }
}

function equipHorse(state, horseId) {
  if (!HORSES[horseId] || !state.economy.ownedHorses.includes(horseId)) return { ok: false, state, message: 'HORSE IS NOT OWNED' }
  state.economy.equippedHorse = horseId
  return { ok: true, state, message: `${horseId.toUpperCase()} EQUIPPED` }
}

function addMetric(state, tasks, metric, amount, completed) {
  for (const definition of tasks) {
    if (definition.metric !== metric || state.daily.claimed[definition.id]) continue
    const next = Math.min(definition.target, (state.daily.progress[definition.id] || 0) + amount)
    state.daily.progress[definition.id] = next
    if (next >= definition.target) {
      state.daily.claimed[definition.id] = true
      state.daily.leaderboardPoints += definition.points
      state.economy.horseshoes += Math.max(10, Math.round(definition.points / 3))
      state.economy.stableXp += Math.max(10, Math.round(definition.points / 2))
      completed.push({ id: definition.id, title: definition.title, points: definition.points })
    }
  }
}

function applyRace(state, input, now = new Date()) {
  const today = ensureToday(state, now), tasks = selectDaily(today), completed = []
  const place = integer(input.place, 6), time = Number(input.time), laps = integer(input.laps, 3), jumps = integer(input.jumps, 30)
  const difficulty = ['EASY', 'NORMAL', 'HARD'].includes(input.difficulty) ? input.difficulty : 'NORMAL'
  if (place < 1 || place > 6 || !Number.isFinite(time) || time < 10 || time > 300 || laps !== 3) throw Object.assign(new Error('Invalid race result'), { statusCode: 422 })
  const placingBonus = place === 1 ? 30 : place <= 3 ? 15 : 0
  state.economy.horseshoes += 20 + placingBonus
  state.economy.stableXp += 25 + placingBonus
  addMetric(state, tasks, 'races', 1, completed)
  addMetric(state, tasks, 'laps', laps, completed)
  if (jumps) addMetric(state, tasks, 'jumps', jumps, completed)
  if (place === 1) addMetric(state, tasks, 'wins', 1, completed)
  if (place < 6) addMetric(state, tasks, 'not_last', 1, completed)
  if (place <= 3) addMetric(state, tasks, 'top3', 1, completed)
  if (place <= 2) addMetric(state, tasks, 'top2', 1, completed)
  if (input.clean === true) addMetric(state, tasks, 'clean_races', 1, completed)
  addMetric(state, tasks, `finish_${difficulty.toLowerCase()}`, 1, completed)
  if (place === 1) addMetric(state, tasks, `win_${difficulty.toLowerCase()}`, 1, completed)
  for (const seconds of SPEED_TARGETS) if (time <= seconds) addMetric(state, tasks, `finish_under_${seconds}`, 1, completed)
  return { state, completed, reward: { horseshoes: 20 + placingBonus, stableXp: 25 + placingBonus }, message: place === 1 ? 'RACE WIN' : `FINISHED #${place}` }
}

module.exports = { TASK_BANK, applyRace, claimDaily, cleanName, dateKey, defaultState, equipHorse, purchaseHorse, sanitizeState, selectDaily }
