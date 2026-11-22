import type {WebGLRenderer} from 'three';
export type ChamberState={standardized:boolean;slice:number;selectedCell:number;guided:boolean;reducedMotion:boolean;dark:boolean;cameraYaw:number;cameraPitch:number};
export type ChamberMode='float-fbo'|'half-float-fbo'|'instanced-spring';
export type ChamberScene={mode:ChamberMode;cellCount:number;frame:(dt:number,elapsed:number,state:ChamberState)=>void;resize:(width:number,height:number,dpr:number)=>void;pick:(x:number,y:number)=>number|null;dispose:()=>void};
export type ChamberFactory=(renderer:WebGLRenderer)=>ChamberScene;
