import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import {gsap} from 'gsap';
import type {ChamberFactory} from './chamberTypes';
import {bezierPoint,MINERAL,GPU_SLAB_SIZE,gpuSlabLayout,queueTarget,sharedSelections,type Point3,type SibylState} from './sibylModel';
let rapierReady:Promise<typeof RAPIER>|undefined;
function physics(){return rapierReady??=(import('@dimforge/rapier3d-compat').then(async module=>{const api=module.default;await api.init();return api;}).catch(error=>{rapierReady=undefined;throw error;}));}
/** Qualitative GPU chamber. Rapier owns baseline collisions; the host owns the clock. */
export const createSibylEngine:ChamberFactory<SibylState>=async renderer=>{
 const R=await physics();
 const world=new R.World({x:0,y:-2.4,z:0});
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,80);
 const root=new THREE.Group();scene.add(root);
 const ambient=new THREE.HemisphereLight('#fff9e9','#536156',2.5);scene.add(ambient);
 const key=new THREE.DirectionalLight('#fff5df',4.2);key.position.set(4,8,6);scene.add(key);
 const fill=new THREE.DirectionalLight('#9aabbb',2);fill.position.set(-5,3,-4);scene.add(fill);
 const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
 try {
 const geometry=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g;};
 const material=<T extends THREE.Material>(m:T)=>{materials.add(m);return m;};
 const time={value:0},merge={value:0};
 function ripple(color:string){const m=material(new THREE.MeshPhysicalMaterial({color,roughness:.32,metalness:.22,clearcoat:.8,transparent:true,opacity:.9}));m.onBeforeCompile=shader=>{
  shader.uniforms.uSibylTime=time;shader.uniforms.uSibylMerge=merge;
  shader.vertexShader='varying vec3 vSibylPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSibylPoint = position;');
  shader.fragmentShader=`uniform float uSibylTime; uniform float uSibylMerge; varying vec3 vSibylPoint;
// J0 series near the origin; asymptotic Bessel form beyond it.
float sibylJ0(float x){x=abs(x);if(x>7.0)return sqrt(0.636619772/max(x,0.001))*cos(x-0.785398163);float sum=1.0;float term=1.0;for(int k=1;k<17;k++){float fk=float(k);term*=-x*x/(4.0*fk*fk);sum+=term;}return sum;}
`+shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat r = length(vSibylPoint.xz) * 12.0;\nfloat wave = pow(max(0.0, sibylJ0(r - mod(uSibylTime * 3.0, 15.0))), 7.0);\ntotalEmissiveRadiance += vec3(1.0) * wave * uSibylMerge * 1.4;');
 };m.customProgramCacheKey=()=> 'sibyl-bessel-j0-v1';return m;}
 const slabGeo=geometry(new THREE.BoxGeometry(GPU_SLAB_SIZE.width,GPU_SLAB_SIZE.height,GPU_SLAB_SIZE.depth,28,1,8));
 const slabMats=[ripple('#090909'),ripple('#ede8dc'),ripple('#090909'),ripple('#f4eee3')];
 const slabs=slabMats.map((m,i)=>{const mesh=new THREE.Mesh(slabGeo,m);mesh.position.set(0,.12,(i-1.5)*1.08);root.add(mesh);const trim=new THREE.Mesh(geometry(new THREE.BoxGeometry(3.65,.025,.025)),material(new THREE.MeshBasicMaterial({color:MINERAL[i]})));trim.position.set(0,.277,(i-1.5)*1.08+.34);root.add(trim);return {mesh,trim};});
 const ribbonMat=ripple('#657377');ribbonMat.opacity=.42;
 const ribbonGeo=geometry(new THREE.BoxGeometry(4.55,.045,.44,64,1,4));const ribbonPos=ribbonGeo.getAttribute('position');for(let i=0;i<ribbonPos.count;i++){const x=ribbonPos.getX(i);ribbonPos.setY(i,ribbonPos.getY(i)+Math.sin(x*1.1)*.24);ribbonPos.setZ(i,ribbonPos.getZ(i)+Math.cos(x*.8)*.16);}ribbonGeo.computeVertexNormals();
 const ribbon=new THREE.Mesh(ribbonGeo,ribbonMat);ribbon.position.set(0,2.2,-.1);ribbon.rotation.z=-.055;root.add(ribbon);
 const grid=new THREE.GridHelper(9,18,'#9a9b90','#c6c2b6');grid.position.y=-.23;root.add(grid);geometry(grid.geometry);material(grid.material);
 const floorMat=material(new THREE.MeshStandardMaterial({color:'#c7c6b8',transparent:true,opacity:.12,roughness:1}));
 const floor=new THREE.Mesh(geometry(new THREE.BoxGeometry(5.2,.08,5.3)),floorMat);floor.position.y=-.17;root.add(floor);
 // Fixed queue floor, side walls and a narrow dispatch gate produce physical contention.
 const colliders=[R.ColliderDesc.cuboid(2.6,.1,2.65).setTranslation(0,-.12,0),R.ColliderDesc.cuboid(.1,1,2.65).setTranslation(-2.55,.8,0),R.ColliderDesc.cuboid(.1,1,.93).setTranslation(2.2,.8,-1.72),R.ColliderDesc.cuboid(.1,1,.93).setTranslation(2.2,.8,1.72),R.ColliderDesc.cuboid(2.6,1,.1).setTranslation(0,.8,-2.65),R.ColliderDesc.cuboid(2.6,1,.1).setTranslation(0,.8,2.65)];
 for(const desc of colliders)world.createCollider(desc);
 const gateMat=material(new THREE.MeshStandardMaterial({color:'#7d8d9c',transparent:true,opacity:.22,roughness:.6}));
 const gates=[-1.72,1.72].map(z=>{const mesh=new THREE.Mesh(geometry(new THREE.BoxGeometry(.1,1,.93*2)),gateMat);mesh.position.set(2.2,.38,z);root.add(mesh);return mesh;});
 const beadGeo=geometry(new THREE.BoxGeometry(.22,.18,.22));
 const beadMats=MINERAL.map(color=>material(new THREE.MeshPhysicalMaterial({color,roughness:.24,metalness:.1,clearcoat:1})));
 const bodies:RAPIER.RigidBody[]=[];const beads:THREE.Mesh[]=[];
 for(let i=0;i<32;i++){const p=queueTarget(i,false,4);const body=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(...p).setLinearDamping(1).setAngularDamping(2));world.createCollider(R.ColliderDesc.cuboid(.11,.09,.11).setRestitution(.14).setFriction(.5).setDensity(.7),body);bodies.push(body);const mesh=new THREE.Mesh(beadGeo,beadMats[Math.floor(i/8)]);mesh.userData.block=i;root.add(mesh);beads.push(mesh);}
 const threadMats=MINERAL.map(color=>material(new THREE.LineBasicMaterial({color,transparent:true,opacity:.3})));
 const threads=Array.from({length:4},(_,i)=>{const points=[new THREE.Vector3(-2,2.2,0),new THREE.Vector3(-1,1.5,(i-1.5)*1.08),new THREE.Vector3(1,1,(i-1.5)*1.08),new THREE.Vector3(2,.55,(i-1.5)*1.08)];const line=new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(new THREE.CubicBezierCurve3(...points as [THREE.Vector3,THREE.Vector3,THREE.Vector3,THREE.Vector3]).getPoints(32))),threadMats[i]);root.add(line);return line;});
 const selectedRing=new THREE.Mesh(geometry(new THREE.TorusGeometry(.21,.013,6,30)),material(new THREE.MeshBasicMaterial({color:'#bd8069'})));root.add(selectedRing);
 const raycaster=new THREE.Raycaster();let width=1,height=1,disposed=false;
 let previousKey='';let previousDark:boolean|undefined;let previousBaseline:boolean|undefined;
 const progress={value:1};let transition:gsap.core.Tween|undefined;let from:Point3[]=[],to:Point3[]=[];let accumulator=0;
 let dragIndex:number|null=null;const dragPoint=new THREE.Vector3();const dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.7);
 const pick=(x:number,y:number)=>{raycaster.setFromCamera(new THREE.Vector2(x,y),camera);return raycaster.intersectObjects(beads).find(hit=>hit.object.visible)?.object.userData.block??null;};
 return {mode:'rapier-queue',cellCount:32,
 frame(dt,elapsed,state){if(disposed)return;
  if(state.reducedMotion){transition?.kill();progress.value=1;}
  const config=`${state.stage}/${state.baseline}/${state.gpus}/${state.overlap}`;
  const coalesced=!state.baseline&&state.stage>=1;
  if(config!==previousKey){transition?.kill();from=beads.map(mesh=>mesh.position.toArray() as Point3);to=beads.map((_,i)=>queueTarget(i,coalesced,state.gpus,state.overlap));progress.value=state.reducedMotion?1:0;
   if(!state.reducedMotion)transition=gsap.to(progress,{value:1,duration:.9,ease:'power2.inOut'});
   if(state.baseline!==previousBaseline){for(let i=0;i<bodies.length;i++){const body=bodies[i]!;body.setBodyType(state.baseline?R.RigidBodyType.Dynamic:R.RigidBodyType.KinematicPositionBased,true);body.setLinvel({x:0,y:0,z:0},true);body.setAngvel({x:0,y:0,z:0},true);if(state.baseline){const p=queueTarget(i,false,4);body.setTranslation({x:p[0]-1,y:p[1],z:p[2]},true);}}previousBaseline=state.baseline;}
   previousKey=config;
  }
  if(previousDark!==state.dark){scene.background=new THREE.Color(state.dark?'#090909':'#FAFAFA');grid.material.opacity=state.dark?.19:.32;grid.material.transparent=true;beadMats.forEach((m,i)=>m.color.set((state.dark?['#6b9080','#6b8cae','#c26d5c','#6b9080']:MINERAL)[i]!));previousDark=state.dark;}
  const yaw=state.cameraYaw;const pitch=state.cameraPitch;camera.position.set(Math.sin(.62+yaw)*11,6+pitch*3,Math.cos(.62+yaw)*11);camera.lookAt(0,.8,0);
  ribbon.scale.x=.62+(Math.log2(state.prefix/65536)/4)*.5;
  time.value=elapsed;merge.value=state.stage===2&&!state.baseline?1:0;
  const activeSurfaces=gpuSlabLayout(state.gpus);slabs.forEach(({mesh,trim},i)=>{const surface=activeSurfaces[i];mesh.visible=!!surface;trim.visible=!!surface;if(surface){mesh.position.z=surface.z;trim.position.z=surface.z+.34;}});
  gates.forEach(g=>{g.visible=state.baseline;});threads.forEach(thread=>{thread.visible=!state.baseline;});
  if(state.baseline&&!state.reducedMotion){accumulator+=Math.min(dt,.05);let steps=0;while(accumulator>=1/60&&steps++<3){for(let i=0;i<bodies.length;i++){const body=bodies[i]!;if(i===dragIndex)continue;const p=body.translation();const v=body.linvel();body.setLinvel({x:Math.min(v.x+.055,.75),y:v.y,z:v.z-p.z*.003},true);if(p.x>2.9||p.y<-.5)body.setTranslation({x:-2.1,y:1.2+(i%4)*.15,z:(Math.floor(i/8)-1.5)*1.08},true);}world.timestep=1/60;world.step();accumulator-=1/60;}}
  const rows=sharedSelections(state.overlap);for(let i=0;i<beads.length;i++){const mesh=beads[i]!,body=bodies[i]!;mesh.visible=!coalesced||(!state.reducedMotion&&progress.value<.999)||rows.findIndex(row=>row.includes(rows[Math.floor(i/8)]![i%8]!))===Math.floor(i/8);
   if(state.baseline){const p=body.translation(),q=body.rotation();mesh.position.set(p.x,p.y+.3,p.z);mesh.quaternion.set(q.x,q.y,q.z,q.w);}else{const p=bezierPoint(from[i]!,to[i]!,state.reducedMotion?1:progress.value);mesh.position.set(...p);mesh.quaternion.identity();body.setNextKinematicTranslation({x:p[0],y:p[1],z:p[2]});} }
  const selected=beads[Math.max(0,Math.min(31,state.selected))]!;selectedRing.visible=selected.visible;selectedRing.position.copy(selected.position);selectedRing.quaternion.copy(camera.quaternion);selectedRing.scale.setScalar(state.reducedMotion?1:1+Math.sin(elapsed*3)*.06);
  renderer.render(scene,camera);
 },resize(w,h){width=w;height=h;camera.aspect=width/height;camera.updateProjectionMatrix();},pick,
 beginDrag(x,y){const index=pick(x,y);if(index===null||!previousBaseline)return null;dragIndex=index;return index;},
 drag(x,y){if(dragIndex===null)return;raycaster.setFromCamera(new THREE.Vector2(x,y),camera);if(raycaster.ray.intersectPlane(dragPlane,dragPoint)){const body=bodies[dragIndex]!;body.setTranslation({x:Math.max(-2.1,Math.min(2.6,dragPoint.x)),y:.7,z:Math.max(-2.2,Math.min(2.2,dragPoint.z))},true);body.setLinvel({x:0,y:0,z:0},true);}},endDrag(){dragIndex=null;},
 dispose(){if(disposed)return;disposed=true;transition?.kill();gsap.killTweensOf(progress);world.free();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.clear();}
 };
 }catch(error){world.free();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.clear();throw error;}
};
