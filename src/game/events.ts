export type RaceResult={horseId:number;place:number;time?:number;laps:number}
export type GameEventMap={raceStarted:{seed:number};countdownTick:{value:number};lapCompleted:{horseId:number;lap:number;time:number};raceFinished:{results:RaceResult[]};boostUsed:{horseId:number};obstacleCleared:{horseId:number};offTrackEntered:{horseId:number};wrongWayStarted:{horseId:number};playerFinished:{position:number;time:number};taskCompleted:{taskId:string;title:string;points:number}}
type Listener<K extends keyof GameEventMap>=(payload:GameEventMap[K])=>void
const listeners:Partial<{[K in keyof GameEventMap]:Listener<K>[]}>= {}
export const gameEvents={on<K extends keyof GameEventMap>(name:K,listener:Listener<K>){const list=(listeners[name]??[]) as Listener<K>[];list.push(listener);(listeners as any)[name]=list},emit<K extends keyof GameEventMap>(name:K,payload:GameEventMap[K]){for(const listener of (listeners[name]??[]) as Listener<K>[])listener(payload)}}
