import type {BaseChamberState} from './chamberTypes';
export type Vec3=[number,number,number];
export type RagState=BaseChamberState&{connected:boolean;progress:number;queryId:number;threshold:number;idleMinutes:number;primaryReaped:boolean;idleReaped:boolean;aws:boolean;load:number;selected:number;fault:number;view:number};
export const MATCHES=[{title:'Session-owned query state',score:.94},{title:'Reconnect snapshot',score:.86},{title:'Supervised processes',score:.73},{title:'Embedding pipeline',score:.59}];
export const filterMatches=(threshold:number)=>MATCHES.filter(x=>x.score>=threshold);
export const createRagState=():RagState=>({dark:false,reducedMotion:false,connected:true,progress:.16,queryId:1,threshold:.7,idleMinutes:0,primaryReaped:false,idleReaped:false,aws:false,load:1,selected:0,fault:0,view:0});
export const severSocket=(state:RagState):RagState=>state.connected?{...state,connected:false,idleMinutes:0,fault:state.fault+1}:state;
export const reconnectSocket=(state:RagState):RagState=>({...state,connected:true,primaryReaped:false,idleMinutes:0,queryId:state.primaryReaped?state.queryId+1:state.queryId,progress:state.primaryReaped?.16:state.progress});
export const advanceQuery=(state:RagState,seconds:number):RagState=>{if(state.primaryReaped)return state;const progress=Math.min(1,state.progress+Math.max(0,seconds)*.028*state.load);return {...state,progress,idleMinutes:state.progress<1&&progress===1?0:state.idleMinutes};};
export const reapIdle=(state:RagState,minutes:number):RagState=>({...state,idleMinutes:minutes,idleReaped:minutes>=10,primaryReaped:!state.connected&&state.progress>=1&&minutes>=10});
export type Cable={points:Vec3[];previous:Vec3[];connected:boolean;rest:number;recoil:number};
export function createCable(start:Vec3,end:Vec3,count=25):Cable{const points=Array.from({length:count},(_,i)=>{const t=i/(count-1);return start.map((v,j)=>v+(end[j]-v)*t-(j===1?Math.sin(t*Math.PI)*.15:0)) as Vec3;});points[0]=[...start];points[count-1]=[...end];return {points,previous:points.map(p=>[...p]),connected:true,rest:Math.hypot(...end.map((v,j)=>v-start[j]))*1.12/(count-1),recoil:0};}
export function cableTension(cable:Cable,target:Vec3){return Math.hypot(...target.map((v,j)=>v-cable.points[0][j]))/(cable.rest*(cable.points.length-1));}
export function breakCable(cable:Cable){if(!cable.connected)return;cable.connected=false;cable.recoil=1;for(let i=1;i<cable.points.length;i++)cable.previous[i][2]-=Math.sin(i/cable.points.length*Math.PI*2)*.15;}
export function reconnectCable(cable:Cable,start:Vec3,end:Vec3){Object.assign(cable,createCable(start,end,cable.points.length));}
export function stepCable(cable:Cable,delta:number,start:Vec3,end:Vec3,reduced=false){
 const dt=Math.max(0,Math.min(.033,delta)),n=cable.points.length;
 if(reduced){const straight=createCable(start,end,n);cable.points=straight.points; cable.previous=straight.previous;if(!cable.connected)for(let i=1;i<n;i++)cable.points[i][2]+=.38*Math.sin(i/n*Math.PI*2);return;}
 for(let i=1;i<n;i++){const p=cable.points[i],old=[...p] as Vec3;for(let j=0;j<3;j++)p[j]+=(p[j]-cable.previous[i][j])*.96+(j===1?-1.3*dt*dt:0);cable.previous[i]=old;}
 for(let pass=0;pass<8;pass++){
  cable.points[0]=[...start];if(cable.connected)cable.points[n-1]=[...end];
  for(let i=0;i<n-1;i++){const a=cable.points[i],b=cable.points[i+1],d=b.map((v,j)=>v-a[j]),len=Math.hypot(...d)||1,correction=(len-cable.rest)/len;for(let j=0;j<3;j++){if(i!==0)a[j]+=d[j]*correction*.5;if(!(cable.connected&&i+1===n-1))b[j]-=d[j]*correction*.5;}}
 }
 cable.points[0]=[...start];if(cable.connected)cable.points[n-1]=[...end];cable.recoil=Math.max(0,cable.recoil-dt*.8);
}
