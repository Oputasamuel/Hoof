export const touchInput={left:false,right:false,jump:false,boost:false,lastEvent:0}
export function setTouch(name:'left'|'right'|'jump'|'boost',value:boolean,time=0){touchInput[name]=value;touchInput.lastEvent=time}
export function clearTouchInput(){touchInput.left=touchInput.right=touchInput.jump=touchInput.boost=false;touchInput.lastEvent=0}
