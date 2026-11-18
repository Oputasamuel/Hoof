import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { gameEvents } from './events'
let gate: Entity | null = null
let baseY = 0
function findGate() { if (gate !== null) return; gate=engine.getEntityOrNullByName('StartGate'); if (gate !== null) baseY=Transform.get(gate).position.y }
function setOpen(open:boolean){findGate();if(gate===null)return;const t=Transform.getMutable(gate);t.position={...t.position,y:baseY+(open?5:0)}}
gameEvents.on('countdownTick',({value})=>{if(value>0)setOpen(false)})
gameEvents.on('raceStarted',()=>setOpen(true))
