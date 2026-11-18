/** @jsx ReactEcs.createElement */
import ReactEcs from'@dcl/sdk/react-ecs';import{HorseButton}from'./HorseButton'
export function ToggleButton(p:{id:string;label:string;value:boolean;onChange:(v:boolean)=>void}){return <HorseButton id={p.id} label={`${p.label}: ${p.value?'ON':'OFF'}`} selected={p.value} onPress={()=>p.onChange(!p.value)}/>}
