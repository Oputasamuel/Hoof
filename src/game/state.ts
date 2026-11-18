import { Difficulty } from './config'
export enum RaceState { LOBBY='LOBBY', DIFFICULTY_SELECT='DIFFICULTY_SELECT', INTRO='INTRO', COUNTDOWN='COUNTDOWN', RACING='RACING', PLAYER_FINISHED='PLAYER_FINISHED', RESULTS='RESULTS', PAUSED='PAUSED' }
export interface GameState { state: RaceState; previous: RaceState; difficulty: Difficulty; elapsed: number; countdown: number; seed: number; touchControls: boolean; cameraFar: boolean; menuPage: 'MAIN'|'TASKS'|'LEADERBOARD'|'HOW_TO_PLAY'|'STABLE'|'DAILY'|'PADDOCK' }
export const gameState: GameState = { state: RaceState.DIFFICULTY_SELECT, previous: RaceState.LOBBY, difficulty: 'NORMAL', elapsed: 0, countdown: 3, seed: 1, touchControls: true, cameraFar: false, menuPage: 'MAIN' }
export function setRaceState(next: RaceState) { gameState.previous = gameState.state; gameState.state = next; gameState.elapsed = 0 }
export function isRaceActive() { return gameState.state === RaceState.RACING || gameState.state === RaceState.PLAYER_FINISHED }
