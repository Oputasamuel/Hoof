'use strict'

const assert = require('node:assert/strict')
const { TASK_BANK, applyRace, claimDaily, defaultState, equipHorse, purchaseHorse, selectDaily } = require('./rules')

assert.equal(TASK_BANK.length, 100)
assert.equal(selectDaily('2026-11-20').length, 20)
assert.deepEqual(selectDaily('2026-11-20').map(x => x.id), selectDaily('2026-11-20').map(x => x.id))

const state = defaultState()
const claimed = claimDaily(state, new Date('2026-11-20T12:00:00Z'))
assert.equal(claimed.claimed, true)
assert.equal(claimDaily(state, new Date('2026-11-20T18:00:00Z')).claimed, false)
assert.equal(purchaseHorse(state, 'moonlight').ok, false)
state.economy.horseshoes = 1000
assert.equal(purchaseHorse(state, 'moonlight').ok, true)
assert.equal(equipHorse(state, 'moonlight').ok, true)
assert.equal(state.economy.equippedHorse, 'moonlight')

const beforePoints = state.daily.leaderboardPoints
const race = applyRace(state, { place: 1, time: 32.4, laps: 3, jumps: 4, clean: true, difficulty: 'NORMAL' }, new Date('2026-11-20T18:05:00Z'))
assert.equal(race.reward.horseshoes, 50)
assert.ok(state.economy.horseshoes >= 550)
assert.ok(state.daily.leaderboardPoints >= beforePoints)

assert.throws(() => applyRace(defaultState(), { place: 1, time: 2, laps: 3, difficulty: 'NORMAL' }), /Invalid race result/)
console.log('HOOF backend rules tests passed')
