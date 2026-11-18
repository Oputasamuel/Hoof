import { Entity, MainCamera, Transform, VirtualCamera, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { cameraClearance, trackBounds } from '../track'
import { CAMERA } from './config'
import { HorseController } from './horse'
import { RaceState, gameState } from './state'
export interface CameraRig { camera: Entity; target: Entity; active: boolean; heading: number; finishAngle: number }
const clamp=(v:number,l:number,h:number)=>Math.max(l,Math.min(h,v))
const wrap=(a:number)=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
export function createCameraRig(h:HorseController):CameraRig { const p=Transform.get(h.root).position,target=engine.addEntity();Transform.create(target,{position:Vector3.create(p.x,p.y+1.4,p.z)});const camera=engine.addEntity();Transform.create(camera,{position:Vector3.create(p.x+7,p.y+3,p.z)});VirtualCamera.create(camera,{lookAtEntity:target,fov:CAMERA.fov,defaultTransition:{transitionMode:VirtualCamera.Transition.Time(0)}});return{camera,target,active:false,heading:h.yaw,finishAngle:0} }
export function setCameraActive(r:CameraRig,on:boolean){r.active=on;if(on)MainCamera.createOrReplace(engine.CameraEntity,{virtualCameraEntity:r.camera});else{const m=MainCamera.getMutableOrNull(engine.CameraEntity);if(m)m.virtualCameraEntity=undefined}}
export function updateCameraRig(r:CameraRig,h:HorseController,dt:number){
  if(!r.active)return
  const p=Transform.get(h.root).position,step=Math.min(dt,.05)
  r.heading+=wrap(h.yaw-r.heading)*(1-Math.exp(-CAMERA.headingResponse*step))
  let mode:{distance:number;height:number;lead:number}=gameState.cameraFar?CAMERA.far:CAMERA.near
  if(gameState.state===RaceState.COUNTDOWN)mode=CAMERA.countdown
  let dist:number=mode.distance+(h.boosting?CAMERA.boostDistance:0),lead:number=mode.lead+(h.boosting?CAMERA.boostLead:0),height:number=mode.height,fx=Math.sin(r.heading),fz=Math.cos(r.heading)
  if(gameState.state===RaceState.INTRO){const t=Math.min(1,gameState.elapsed/5),ease=t*t*(3-2*t);dist=25+(CAMERA.near.distance-25)*ease;height=18+(CAMERA.near.height-18)*ease;lead=0}
  if(gameState.state===RaceState.PLAYER_FINISHED||gameState.state===RaceState.RESULTS){r.finishAngle+=dt*.35;fx=Math.sin(r.finishAngle);fz=Math.cos(r.finishAngle);dist=10;height=4.5;lead=0}
  const desired=Vector3.create(clamp(p.x-fx*dist,trackBounds.minX-cameraClearance+.5,trackBounds.maxX+cameraClearance-.5),Math.max(1.2,p.y+height),clamp(p.z-fz*dist,trackBounds.minZ-cameraClearance+.5,trackBounds.maxZ+cameraClearance-.5))
  const look=Vector3.create(p.x+Math.sin(h.yaw)*lead,p.y+CAMERA.targetHeight,p.z+Math.cos(h.yaw)*lead),ct=1-Math.exp(-CAMERA.positionResponse*step),lt=1-Math.exp(-CAMERA.targetResponse*step),c=Transform.getMutable(r.camera),t=Transform.getMutable(r.target)
  c.position=Vector3.lerp(c.position,desired,ct);t.position=Vector3.lerp(t.position,look,lt)
}
