import { gameEvents } from './events'

export type HorseRarity = 'COMMON' | 'RARE' | 'EPIC' | 'ROYAL'

export type HorseDefinition = {
  id: string
  name: string
  modelPath: string
  portraitPath: string
  rarity: HorseRarity
  horseshoePrice?: number
  calendarDay?: number
}

export const HORSE_CATALOG: HorseDefinition[] = [
  { id: 'ember', name: 'EMBER', modelPath: 'assets/Models/Horses/horse-01.glb', portraitPath: 'assets/ui/horse-portrait-1.png', rarity: 'COMMON' },
  { id: 'moonlight', name: 'MOONLIGHT', modelPath: 'assets/Models/Horses/horse-02.glb', portraitPath: 'assets/ui/horse-portrait-2.png', rarity: 'RARE', horseshoePrice: 500, calendarDay: 7 },
  { id: 'nightfall', name: 'NIGHTFALL', modelPath: 'assets/Models/Horses/horse-03.glb', portraitPath: 'assets/ui/horse-portrait-3.png', rarity: 'EPIC', horseshoePrice: 1500, calendarDay: 14 },
  { id: 'sunfire', name: 'SUNFIRE', modelPath: 'assets/Models/Horses/horse-04.glb', portraitPath: 'assets/ui/horse-portrait-4.png', rarity: 'ROYAL', calendarDay: 28 }
]

export type PlayerProfile = {
  horseshoes: number
  stableXp: number
  ownedHorses: string[]
  equippedHorse: string
  calendarDay: number
  calendarCycle: number
  lastClaimDate: string
}

export type DailyReward = { day: number; horseshoes: number; stableXp: number; horseId?: string }

const STORAGE_KEY = 'hoof-player-profile-v1'
const defaults: PlayerProfile = {
  horseshoes: 250,
  stableXp: 0,
  ownedHorses: ['ember'],
  equippedHorse: 'ember',
  calendarDay: 0,
  calendarCycle: 1,
  lastClaimDate: ''
}

function loadProfile(): PlayerProfile {
  try {
    const raw = (globalThis as any).localStorage?.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<PlayerProfile>
      const owned = Array.isArray(saved.ownedHorses) ? saved.ownedHorses.filter(id => HORSE_CATALOG.some(h => h.id === id)) : ['ember']
      if (!owned.includes('ember')) owned.unshift('ember')
      const equipped = owned.includes(saved.equippedHorse ?? '') ? saved.equippedHorse! : 'ember'
      return {
        horseshoes: Math.max(0, Math.floor(Number(saved.horseshoes) || 0)),
        stableXp: Math.max(0, Math.floor(Number(saved.stableXp) || 0)),
        ownedHorses: owned,
        equippedHorse: equipped,
        calendarDay: Math.max(0, Math.min(27, Math.floor(Number(saved.calendarDay) || 0))),
        calendarCycle: Math.max(1, Math.floor(Number(saved.calendarCycle) || 1)),
        lastClaimDate: typeof saved.lastClaimDate === 'string' ? saved.lastClaimDate : ''
      }
    }
  } catch {}
  return { ...defaults, ownedHorses: [...defaults.ownedHorses] }
}

let profile = loadProfile()
let initialized = false
let lastRewardMessage = ''

function saveProfile() {
  try { (globalThis as any).localStorage?.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch {}
}

export function exportEconomyState(): PlayerProfile {
  return { ...profile, ownedHorses: [...profile.ownedHorses] }
}

export function hydrateEconomyState(value: Partial<PlayerProfile> | undefined) {
  if (!value) return
  const owned = Array.isArray(value.ownedHorses) ? value.ownedHorses.filter(id => HORSE_CATALOG.some(h => h.id === id)) : ['ember']
  if (!owned.includes('ember')) owned.unshift('ember')
  profile = {
    horseshoes: Math.max(0, Math.min(1000000, Math.floor(Number(value.horseshoes) || 0))),
    stableXp: Math.max(0, Math.min(10000000, Math.floor(Number(value.stableXp) || 0))),
    ownedHorses: owned,
    equippedHorse: owned.includes(value.equippedHorse ?? '') ? value.equippedHorse! : 'ember',
    calendarDay: Math.max(0, Math.min(27, Math.floor(Number(value.calendarDay) || 0))),
    calendarCycle: Math.max(1, Math.floor(Number(value.calendarCycle) || 1)),
    lastClaimDate: typeof value.lastClaimDate === 'string' ? value.lastClaimDate : ''
  }
  saveProfile()
}

function utcDateKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function rewardForDay(day: number): DailyReward {
  const horse = HORSE_CATALOG.find(h => h.calendarDay === day)
  if (horse) return { day, horseshoes: 100 + day * 10, stableXp: 80 + day * 5, horseId: horse.id }
  const milestone = day % 7 === 0
  return { day, horseshoes: milestone ? 350 : 70 + day * 8, stableXp: milestone ? 180 : 35 + day * 3 }
}

function addRewards(horseshoes: number, stableXp: number, reason: string) {
  profile.horseshoes += Math.max(0, Math.floor(horseshoes))
  profile.stableXp += Math.max(0, Math.floor(stableXp))
  lastRewardMessage = `+${horseshoes} HORSESHOES  •  +${stableXp} STABLE XP  •  ${reason}`
  saveProfile()
}

export function initializeEconomy() {
  if (initialized) return
  initialized = true
  gameEvents.on('raceFinished', ({ results }) => {
    const player = results.find(result => result.horseId === 0)
    if (!player) return
    const placingBonus = player.place === 1 ? 30 : player.place <= 3 ? 15 : 0
    addRewards(20 + placingBonus, 25 + placingBonus, player.place === 1 ? 'RACE WIN' : `FINISHED #${player.place}`)
  })
  gameEvents.on('taskCompleted', ({ title, points }) => {
    addRewards(Math.max(10, Math.round(points / 3)), Math.max(10, Math.round(points / 2)), `TASK: ${title}`)
  })
}

export function getProfile() { return profile }
export function getStableLevel() { return 1 + Math.floor(profile.stableXp / 250) }
export function getLastRewardMessage() { return lastRewardMessage }
export function isHorseOwned(id: string) { return profile.ownedHorses.includes(id) }
export function isHorseEquipped(id: string) { return profile.equippedHorse === id }
export function getEquippedHorse() { return HORSE_CATALOG.find(h => h.id === profile.equippedHorse) ?? HORSE_CATALOG[0] }

export function purchaseHorse(id: string) {
  const horse = HORSE_CATALOG.find(item => item.id === id)
  if (!horse || !horse.horseshoePrice || isHorseOwned(id) || profile.horseshoes < horse.horseshoePrice) return false
  profile.horseshoes -= horse.horseshoePrice
  profile.ownedHorses.push(id)
  lastRewardMessage = `${horse.name} JOINED YOUR STABLE`
  saveProfile()
  return true
}

export function equipHorse(id: string) {
  if (!isHorseOwned(id) || !HORSE_CATALOG.some(h => h.id === id)) return false
  profile.equippedHorse = id
  saveProfile()
  return true
}

export function canClaimDailyReward() { return profile.lastClaimDate !== utcDateKey() }
export function getNextDailyReward() { return rewardForDay(profile.calendarDay + 1) }
export function getUpcomingDailyRewards(count = 7) {
  return Array.from({ length: count }, (_, index) => rewardForDay(((profile.calendarDay + index) % 28) + 1))
}

export function claimDailyReward() {
  if (!canClaimDailyReward()) return undefined
  const reward = getNextDailyReward()
  profile.horseshoes += reward.horseshoes
  profile.stableXp += reward.stableXp
  let horseMessage = ''
  if (reward.horseId) {
    const horse = HORSE_CATALOG.find(item => item.id === reward.horseId)!
    if (isHorseOwned(horse.id)) {
      profile.horseshoes += 500
      horseMessage = ' • DUPLICATE +500 HORSESHOES'
    } else {
      profile.ownedHorses.push(horse.id)
      horseMessage = ` • UNLOCKED ${horse.name}`
    }
  }
  profile.lastClaimDate = utcDateKey()
  profile.calendarDay++
  if (profile.calendarDay >= 28) {
    profile.calendarDay = 0
    profile.calendarCycle++
  }
  lastRewardMessage = `DAY ${reward.day}: +${reward.horseshoes} HORSESHOES • +${reward.stableXp} XP${horseMessage}`
  saveProfile()
  return reward
}
