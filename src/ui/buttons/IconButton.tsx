/** @jsx ReactEcs.createElement */
import ReactEcs from'@dcl/sdk/react-ecs';import{HorseButton}from'./HorseButton'
export function IconButton(p:{id:string;label:string;onPress:()=>void;hotkeyHint?:string}){return <HorseButton {...p} size="sm" width={132} height={74} variant="ghost"/>}
