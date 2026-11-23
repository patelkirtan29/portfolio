import type {WebGLRenderer} from 'three';
export type BaseChamberState={reducedMotion:boolean;dark:boolean};
export type ChamberState=BaseChamberState&{standardized:boolean;slice:number;selectedCell:number;guided:boolean;cameraYaw:number;cameraPitch:number};
export type ChamberMode='float-fbo'|'half-float-fbo'|'instanced-spring'|'rapier-verlet'|'rapier-queue'|'gpgpu-verlet'|'cpu-verlet';
export type ChamberScene<S extends BaseChamberState=ChamberState>={mode:ChamberMode;cellCount:number;frame:(dt:number,elapsed:number,state:S)=>void;resize:(width:number,height:number,dpr:number)=>void;pick:(x:number,y:number)=>number|null;beginDrag?:(x:number,y:number)=>number|null;drag?:(x:number,y:number)=>void;endDrag?:()=>void;dispose:()=>void};
export type ChamberFactory<S extends BaseChamberState=ChamberState>=(renderer:WebGLRenderer)=>ChamberScene<S>|Promise<ChamberScene<S>>;
