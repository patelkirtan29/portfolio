import * as THREE from 'three';
import type {ChamberScene} from './chamberTypes';
import {createCable,stepCable,breakCable,reconnectCable,type RagState,type Vec3,filterMatches} from './ragModel';
type Rapier=typeof import('@dimforge/rapier3d-compat');
let rapierPromise:Promise<Rapier>|undefined;
const loadRapier=()=>rapierPromise??=(async()=>{const module=await import('@dimforge/rapier3d-compat');await module.init();return module;})().catch(error=>{rapierPromise=undefined;throw error;});
export async function createRagEngine(renderer:THREE.WebGLRenderer,onSever:()=>void):Promise<ChamberScene<RagState>>{
 const R=await loadRapier();
 const world=new R.World({x:0,y:-.28,z:0});
 const owned:Array<{dispose:()=>void}>=[];
 const own=<T extends {dispose:()=>void}>(item:T):T=>{owned.push(item);return item;};
 let disposed=false;
 try{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,70);let viewportWidth=900;
 camera.position.set(7,7.3,11.8);camera.lookAt(0,.7,0);
 scene.add(new THREE.HemisphereLight('#dcece8','#242a2a',3));
 const key=new THREE.DirectionalLight('#ffffff',5);key.position.set(2,7,4);scene.add(key);
 const rim=new THREE.PointLight('#a8d6c0',35,20);rim.position.set(-4,3,-3);scene.add(rim);
 const amberLight=new THREE.PointLight('#D97706',0,7);scene.add(amberLight);
 const metal=own(new THREE.MeshStandardMaterial({color:'#7d888c',metalness:.86,roughness:.28}));
 const darkMetal=own(new THREE.MeshStandardMaterial({color:'#343c3e',metalness:.74,roughness:.39}));
 const sage=own(new THREE.MeshStandardMaterial({color:'#6B9080',emissive:'#6B9080',emissiveIntensity:.3,metalness:.5,roughness:.35}));
 const crystal=own(new THREE.MeshPhysicalMaterial({color:'#a7c5b9',metalness:.08,roughness:.12,transparent:true,opacity:.34,side:THREE.DoubleSide,clearcoat:1,depthWrite:false}));
 const amber=own(new THREE.MeshBasicMaterial({color:'#D97706',transparent:true}));
 const floorMat=own(new THREE.MeshStandardMaterial({color:'#101414',roughness:.9,metalness:.25}));
 const floor=new THREE.Mesh(own(new THREE.CylinderGeometry(4.65,4.9,.15,96)),floorMat);floor.position.y=-.9;scene.add(floor);
 const baseLip=new THREE.Mesh(own(new THREE.TorusGeometry(4.65,.025,8,128)),metal);baseLip.rotation.x=Math.PI/2;baseLip.position.y=-.81;scene.add(baseLip);
 const grid=new THREE.GridHelper(8,24,'#6B9080','#53605b');grid.position.y=-.81;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.13;scene.add(grid);own(grid.geometry);own(grid.material as THREE.Material);
 const cylinder=own(new THREE.CylinderGeometry(.035,.035,1,8));
 function strut(a:THREE.Vector3,b:THREE.Vector3,mat:THREE.Material=metal){const mesh=new THREE.Mesh(cylinder,mat);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return mesh;}
 const rings:Array<{mesh:THREE.Group;body:import('@dimforge/rapier3d-compat').RigidBody;base:Vec3}>=[];
 for(let i=0;i<3;i++){
  const radius=3.65-i*.94,y=.05+i*.45,group=new THREE.Group();
  const torus=new THREE.Mesh(own(new THREE.TorusGeometry(radius,.09-i*.009,12,144)),metal);torus.rotation.x=Math.PI/2;group.add(torus);
  const inlay=new THREE.Mesh(own(new THREE.TorusGeometry(radius,.018,6,144)),sage);inlay.rotation.x=Math.PI/2;inlay.position.y=.095;group.add(inlay);
  for(let k=0;k<36;k++){const a=k/36*Math.PI*2;const tick=new THREE.Mesh(own(new THREE.BoxGeometry(.025,.028,k%3===0?.16:.065)),k%3===0?sage:darkMetal);tick.position.set(Math.sin(a)*radius,.1,Math.cos(a)*radius);tick.rotation.y=a;group.add(tick);}
  const base:Vec3=[0,y,0],anchor=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(...base));
  const body=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(...base).setLinearDamping(3).setAngularDamping(3).setAdditionalMass(2));
  world.createImpulseJoint(R.JointData.spring(0,65,12,{x:0,y:0,z:0},{x:0,y:0,z:0}),anchor,body,true);
  group.position.set(...base);scene.add(group);rings.push({mesh:group,body,base});
 }
 for(let k=0;k<6;k++){const a=k/6*Math.PI*2;scene.add(strut(new THREE.Vector3(Math.cos(a)*3.65,-.75,Math.sin(a)*3.65),new THREE.Vector3(Math.cos(a)*3.65,.05,Math.sin(a)*3.65),darkMetal));}
 const primaryHome:Vec3=[1.35,1.85,.1];
 const homes:Vec3[]=[primaryHome,[-1.6,1.25,-1.15],[-1.1,1.35,1.65]];
 const capsules=homes.map((home,index)=>{
  const group=new THREE.Group(),shell=new THREE.Mesh(own(new THREE.CapsuleGeometry(.26,.64,6,12)),crystal);group.add(shell);
  const core=new THREE.Mesh(own(new THREE.OctahedronGeometry(.19,0)),sage);core.scale.y=1.65;group.add(core);
  for(const y of [-.34,.34]){const collar=new THREE.Mesh(own(new THREE.TorusGeometry(.27,.038,8,32)),metal);collar.rotation.x=Math.PI/2;collar.position.y=y;group.add(collar);}
  const top=new THREE.Vector3(home[0],home[1]+1.05,home[2]);scene.add(strut(top.clone().add(new THREE.Vector3(-.3,.1,0)),top.clone().add(new THREE.Vector3(.3,.1,0))));
  const fixed=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(top.x,top.y,top.z));
  const body=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(...home).setLinearDamping(2.4).setAngularDamping(2).setAdditionalMass(.7));
  world.createCollider(R.ColliderDesc.capsule(.32,.26).setRestitution(.25),body);
  world.createImpulseJoint(R.JointData.spring(.69,32,5,{x:0,y:0,z:0},{x:0,y:.36,z:0}),fixed,body,true);
  const wire=own(new THREE.BufferGeometry().setFromPoints([top,new THREE.Vector3(...home)]));const line=new THREE.Line(wire,own(new THREE.LineBasicMaterial({color:'#899793',transparent:true,opacity:.45})));scene.add(line,group);group.position.set(...home);
  return {group,body,core,shell,wire,line,top,index};
 });
 const labels:Array<{sprite:THREE.Sprite;text:string;canvas:HTMLCanvasElement;texture:THREE.CanvasTexture}>=[];
 function label(text:string,position:Vec3,scale=2.1){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=92;const texture=own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;const material=own(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));const sprite=new THREE.Sprite(material);sprite.position.set(...position);sprite.scale.set(scale,scale*92/768,1);scene.add(sprite);labels.push({sprite,text,canvas,texture});return sprite;}
 label('01  UserSocket · ingress',[-3.1,.6,2.4],2.7);
 label('02  Registry · lookup',[-2.3,1.3,-1.85],2.5);
 label('03  QuerySupervisor',[.6,1,-2.25],2.7);
 const capsuleLabel=label('QueryServer · session 01',[1.35,2.7,.1],2.55);
 label('IDLE / disconnected',[-1.6,2.15,-1.15],2.1);
 label('SESSION / 03',[-1.1,2.23,1.65],1.7);
 const socket=new THREE.Mesh(own(new THREE.IcosahedronGeometry(.13,1)),sage);socket.position.set(-3.3,.23,1.55);scene.add(socket);
 const registry=new THREE.Vector3(-1.9,.85,-1.2),socketPoint=socket.position.clone();
 const cable=createCable(socketPoint.toArray() as Vec3,primaryHome,33);
 const cablePositions=new Float32Array(cable.points.length*3),cableGeometry=own(new THREE.BufferGeometry());cableGeometry.setAttribute('position',new THREE.BufferAttribute(cablePositions,3));
 const cableMat=own(new THREE.LineBasicMaterial({color:'#6B9080',transparent:true,opacity:.95}));const cableLine=new THREE.Line(cableGeometry,cableMat);scene.add(cableLine);
 const spark=new THREE.Group();for(let i=0;i<12;i++){const dir=new THREE.Vector3(Math.sin(i*2.4),Math.cos(i*2.4),Math.sin(i*.9)).normalize();const line=new THREE.Line(own(new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(.07),dir.multiplyScalar(.38)])),amber);spark.add(line);}scene.add(spark);spark.visible=false;
 const faultLabel=label('✕  SEVERED',[0,1.8,1.2],1.4);faultLabel.visible=false;
 const resultRays=Array.from({length:4},(_,i)=>{const end=new THREE.Vector3(3.8,1.1-i*.35,-1.4);const rayMaterial=own(new THREE.LineBasicMaterial({color:'#6B9080',transparent:true,opacity:.5}));const ray=new THREE.Line(own(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...primaryHome),end])),rayMaterial);scene.add(ray);const dot=new THREE.Mesh(own(new THREE.OctahedronGeometry(.065)),sage);dot.position.copy(end);scene.add(dot);return {ray,dot,end};});
 // The proposal is a separate physical wireframe, never a claim about deployed infrastructure.
 const awsGroup=new THREE.Group();scene.add(awsGroup);awsGroup.visible=false;
 const awsLine=own(new THREE.LineBasicMaterial({color:'#6B9080',transparent:true,opacity:.65}));
 const awsLabels:THREE.Sprite[]=[];
 const awsNodes:Vec3[]=[[-3,1.8,0],[-1.4,1.8,0],[.2,1.8,0],[1.8,1.8,0],[3.4,1.8,0]];
 awsNodes.forEach((position,i)=>{const box=own(new THREE.BoxGeometry(1.1,.65,.7));const edges=own(new THREE.EdgesGeometry(box));const frame=new THREE.LineSegments(edges,awsLine);frame.position.set(...position);awsGroup.add(frame);const s=label(['Global Accelerator','SNS → SQS','Lambda','Neptune / Postgres','Bedrock'][i],[position[0],2.4,0],1.7);scene.remove(s);awsGroup.add(s);awsLabels.push(s);if(i){const wire=own(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...awsNodes[i-1]),new THREE.Vector3(...position)]));awsGroup.add(new THREE.Line(wire,awsLine));}});
 const region=own(new THREE.EdgesGeometry(own(new THREE.BoxGeometry(8.3,1.25,1.8))));const regionFrame=new THREE.LineSegments(region,awsLine);regionFrame.position.set(.2,1.8,0);awsGroup.add(regionFrame);
 const raycaster=new THREE.Raycaster();raycaster.params.Line={threshold:.2};
 const plane=new THREE.Plane(),dragPoint=new THREE.Vector3();let dragging=false,hasDrag=false,connected=true,prevFault=0,prevQuery=1,lastDark:boolean|undefined,frameCount=0,sparkTime=0,latest:RagState|undefined;
 function ndcPoint(x:number,y:number){raycaster.setFromCamera(new THREE.Vector2(x,y),camera);return raycaster.ray.intersectPlane(plane,dragPoint);}
 function hit(x:number,y:number){raycaster.setFromCamera(new THREE.Vector2(x,y),camera);const objects=[capsules[0].shell,cableLine];return raycaster.intersectObjects(objects,false).length>0;}
 return {
  mode:'rapier-verlet',cellCount:3,
  resize(width,height){viewportWidth=width;camera.aspect=width/height;camera.position.set(width<600?8:7,width<600?8.5:7.3,width<600?15.5:11.8);camera.lookAt(0,.7,0);camera.updateProjectionMatrix();},
  pick(x,y){return hit(x,y)?0:null;},
  beginDrag(x,y){if(!hit(x,y)||!connected)return null;dragging=true;hasDrag=false;plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),capsules[0].group.position.clone().lerp(socketPoint,.5));ndcPoint(x,y);return 0;},
  drag(x,y){if(!dragging||!ndcPoint(x,y)||!latest)return;hasDrag=true;const end=capsules[0].group.position;const tension=(socketPoint.distanceTo(dragPoint)+dragPoint.distanceTo(end))/(cable.rest*(cable.points.length-1));if(tension>1.65){dragging=false;connected=false;breakCable(cable);spark.position.copy(dragPoint);sparkTime=1;spark.visible=true;onSever();}},
  endDrag(){dragging=false;hasDrag=false;},
  frame(delta,elapsed,state){
   if(disposed)return;latest=state;const dt=Math.max(.001,Math.min(.033,delta));
   const mobile=viewportWidth<600,viewAngle=state.view===1?-.18:state.view===2?.16:0;
   const targetCamera=new THREE.Vector3((mobile?8:7)+viewAngle*9,(mobile?8.5:7.3)-Math.abs(viewAngle)*3,(mobile?15.5:11.8)-Math.abs(viewAngle)*5);
   camera.position.lerp(targetCamera,state.reducedMotion?1:1-Math.exp(-dt*2.5));camera.lookAt(state.view===1?-.5:0,.7,0);
   if(lastDark!==state.dark){lastDark=state.dark;scene.background=new THREE.Color(state.dark?'#090909':'#FAFAFA');floorMat.color.set(state.dark?'#101414':'#d9ddd7');darkMetal.color.set(state.dark?'#343c3e':'#a8b0ad');for(const item of labels){const context=item.canvas.getContext('2d');if(context){context.clearRect(0,0,768,92);context.font='500 32px monospace';context.textAlign='center';context.fillStyle=state.dark?'#c2d3cb':'#2e4d40';context.fillText(item.text,384,58);item.texture.needsUpdate=true;}}}
   if(state.connected!==connected){connected=state.connected;if(connected){reconnectCable(cable,registry.toArray() as Vec3,capsules[0].group.position.toArray() as Vec3);}else{breakCable(cable);spark.position.copy(capsules[0].group.position).lerp(socketPoint,.5);sparkTime=1;}}
   if(state.fault!==prevFault){prevFault=state.fault;capsules[0].body.applyImpulse({x:.7,y:.3,z:.55},true);rings[0].body.applyTorqueImpulse({x:.06,y:.03,z:.1},true);sparkTime=1;}
   if(state.queryId!==prevQuery){prevQuery=state.queryId;capsules[0].body.applyImpulse({x:.25*state.load,y:.45,z:0},true);}
   if(!state.reducedMotion){world.timestep=dt;if(frameCount++%10===0&&state.progress<1&&!state.primaryReaped)capsules[0].body.applyImpulse({x:Math.sin(elapsed*2)*.025*state.load,y:.008,z:Math.cos(elapsed*2)*.02*state.load},true);world.step();}
   for(const ring of rings){if(state.reducedMotion){ring.mesh.position.set(...ring.base);ring.mesh.quaternion.identity();}else{const p=ring.body.translation(),q=ring.body.rotation();ring.mesh.position.set(p.x,p.y,p.z);ring.mesh.quaternion.set(q.x,q.y,q.z,q.w);}}
   for(const item of capsules){const p=item.body.translation(),q=item.body.rotation();if(state.reducedMotion)item.group.position.set(...homes[item.index]);else{item.group.position.set(p.x,p.y,p.z);item.group.quaternion.set(q.x,q.y,q.z,q.w);}item.core.rotation.y=state.reducedMotion?0:elapsed*.6;const hidden=item.index===1?state.idleReaped:item.index===0?state.primaryReaped:false;item.body.setEnabled(!hidden);const target=hidden?.001:1;item.group.scale.lerp(new THREE.Vector3(target,target,target),state.reducedMotion?1:Math.min(1,dt*6));item.line.visible=!hidden;const wirePos=item.wire.getAttribute('position') as THREE.BufferAttribute;wirePos.setXYZ(1,item.group.position.x,item.group.position.y+.36,item.group.position.z);wirePos.needsUpdate=true;item.wire.computeBoundingSphere();}
   labels[4].sprite.visible=!state.idleReaped;capsuleLabel.visible=!state.primaryReaped;capsuleLabel.position.copy(capsules[0].group.position).add(new THREE.Vector3(0,.85,0));
   const start=state.connected&&cable.points[0][0]>-3?registry:socketPoint;
   stepCable(cable,dt,start.toArray() as Vec3,capsules[0].group.position.toArray() as Vec3,state.reducedMotion);
   if(dragging&&hasDrag){const middle=cable.points[Math.floor(cable.points.length/2)];const offset=dragPoint.clone().sub(new THREE.Vector3(...middle));for(let i=1;i<cable.points.length-1;i++){const weight=Math.pow(Math.sin(i/(cable.points.length-1)*Math.PI),3);cable.points[i]=cable.points[i].map((v,j)=>v+offset.getComponent(j)*weight) as Vec3;}}
   cable.points.forEach((p,i)=>cablePositions.set(p,i*3));(cableGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;cableGeometry.computeBoundingSphere();cableLine.visible=!state.primaryReaped;cableMat.color.set(state.connected?'#6B9080':'#D97706');
   sparkTime=Math.max(0,sparkTime-dt*1.6);spark.visible=sparkTime>0;amber.opacity=state.reducedMotion?.8:sparkTime;spark.scale.setScalar(state.reducedMotion?1:1+(1-sparkTime)*2);amberLight.position.copy(spark.position);amberLight.intensity=state.reducedMotion?0:sparkTime*7;faultLabel.visible=!state.connected&&!state.primaryReaped;
   const count=filterMatches(state.threshold).length;resultRays.forEach(({ray,dot,end},i)=>{ray.visible=dot.visible=i<count&&!state.primaryReaped;ray.material.opacity=.25+state.threshold*.65;const positions=ray.geometry.getAttribute('position') as THREE.BufferAttribute;positions.setXYZ(0,capsules[0].group.position.x,capsules[0].group.position.y,capsules[0].group.position.z);positions.needsUpdate=true;ray.geometry.computeBoundingSphere();dot.position.copy(capsules[0].group.position).lerp(end,state.reducedMotion?1:(elapsed*.25+i*.23)%1);});
   awsGroup.visible=state.aws;awsLabels.forEach(s=>s.visible=state.aws);
   renderer.render(scene,camera);
  },
  dispose(){if(disposed)return;disposed=true;world.free();owned.forEach(item=>item.dispose());scene.clear();},
 };
 }catch(error){world.free();owned.forEach(item=>item.dispose());throw error;}
}
