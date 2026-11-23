import {afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import * as R from '@dimforge/rapier3d-compat';
import {createRagEngine} from './ragEngine';
import {createRagState,severSocket,reconnectSocket,reapIdle} from './ragModel';

beforeAll(async()=>{await R.init();});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
const canvasDocument=()=>({createElement:()=>({width:0,height:0,getContext:()=>({clearRect:vi.fn(),fillText:vi.fn(),font:'',textAlign:'',fillStyle:''})})});
describe('actual Rapier chamber lifecycle',()=>{
 it('renders a live WASM spring world, handles faults and disposes once',async()=>{
  vi.stubGlobal('document',canvasDocument());
  const free=vi.spyOn(R.World.prototype,'free'),step=vi.spyOn(R.World.prototype,'step');
  const render=vi.fn((scene:THREE.Scene,camera:THREE.Camera)=>{scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);});
  const renderer={render,dispose:vi.fn()} as unknown as THREE.WebGLRenderer;
  const chamber=await createRagEngine(renderer,vi.fn());
  chamber.resize(900,510,1);let state=createRagState();
  for(let i=0;i<90;i++)chamber.frame(.016,i*.016,state);
  state=severSocket(state);chamber.frame(.016,2,state);
  state=reconnectSocket(state);chamber.frame(.016,2.1,state);
  chamber.frame(.016,2.2,reapIdle({...state,progress:1,connected:false},11));
  const steps=step.mock.calls.length;
  chamber.frame(3,3,{...state,reducedMotion:true,aws:true,dark:true});
  expect(step.mock.calls.length).toBe(steps);
  expect(render).toHaveBeenCalled();expect(chamber.mode).toBe('rapier-verlet');
  chamber.dispose();chamber.dispose();expect(free).toHaveBeenCalledTimes(1);expect(renderer.dispose).not.toHaveBeenCalled();
 });
 it('frees the native world when scene construction fails',async()=>{
  vi.stubGlobal('document',{createElement:()=>{throw new Error('Canvas unavailable');}});
  const free=vi.spyOn(R.World.prototype,'free');
  await expect(createRagEngine({} as THREE.WebGLRenderer,vi.fn())).rejects.toThrow('Canvas unavailable');
  expect(free).toHaveBeenCalledTimes(1);
 });
 it('breaks a picked tether under pointer tension',async()=>{
  vi.stubGlobal('document',canvasDocument());
  let lastCamera:THREE.Camera|undefined;
  const render=(scene:THREE.Scene,camera:THREE.Camera)=>{scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);lastCamera=camera;};
  const sever=vi.fn(),chamber=await createRagEngine({render} as THREE.WebGLRenderer,sever);
  try{chamber.resize(900,510,1);chamber.frame(.016,0,createRagState());
   const point=new THREE.Vector3(1.35,1.85,.1).project(lastCamera!);
   expect(chamber.beginDrag?.(point.x,point.y)).toBe(0);
   chamber.drag?.(3,3);expect(sever).toHaveBeenCalledTimes(1);
  }finally{chamber.dispose();}
 });
});
