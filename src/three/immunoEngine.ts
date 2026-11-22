import * as THREE from 'three';
import type {ChamberScene, ChamberState, ChamberMode} from './chamberTypes';
import {CELL_COUNT, TEXTURE_SIZE, CLUSTER_COLORS, createCellCloud, markerWeights} from './immunoModel';

const quadVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const simulationFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D positions, velocities, rawTarget, alignedTarget;
uniform float dt, time, standardized, motion;
uniform int operation;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 field(vec3 p){return vec3(noise(p),noise(p+vec3(19.1,7.4,3.2)),noise(p+vec3(4.7,29.3,11.8)));}
vec3 curlNoise(vec3 p){float e=.09;vec3 dx=(field(p+vec3(e,0,0))-field(p-vec3(e,0,0)))/(2.*e);vec3 dy=(field(p+vec3(0,e,0))-field(p-vec3(0,e,0)))/(2.*e);vec3 dz=(field(p+vec3(0,0,e))-field(p-vec3(0,0,e)))/(2.*e);return vec3(dy.z-dz.y,dz.x-dx.z,dx.y-dy.x);}
void main(){
 vec3 target=mix(texture2D(rawTarget,vUv).xyz,texture2D(alignedTarget,vUv).xyz,standardized);
 vec3 p=texture2D(positions,vUv).xyz;vec3 v=texture2D(velocities,vUv).xyz;
 if(operation==2){gl_FragColor=vec4(target,1.);return;}
 if(operation==3){gl_FragColor=vec4(0.,0.,0.,1.);return;}
 if(operation==0){vec3 force=(target-p)*3.8+curlNoise(p*.65+vec3(0.,time*.055,0.))*.11*motion;v=(v+force*dt)*exp(-2.9*dt);gl_FragColor=vec4(v,1.);}
 else{gl_FragColor=vec4(p+v*dt,1.);}
}`;
const particleVertex = `
uniform sampler2D positions;uniform float pixelRatio, selected;attribute vec2 lookup;attribute vec3 cellColor;attribute float cellId;
varying vec3 vColor;varying float vSelected;
void main(){vec3 p=texture2D(positions,lookup).xyz;vec4 mv=modelViewMatrix*vec4(p,1.);vColor=cellColor;vSelected=1.-step(.1,abs(cellId-selected));gl_Position=projectionMatrix*mv;gl_PointSize=clamp((22.+vSelected*14.)*pixelRatio/-mv.z,1.6*pixelRatio,8.*pixelRatio);}`;
const particleFragment = `varying vec3 vColor;varying float vSelected;uniform float dark;void main(){float r=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(.72,1.,r);if(a<.01)discard;vec3 c=mix(vColor,mix(vec3(.035),vec3(.98),dark),vSelected*.7);gl_FragColor=vec4(c,a*.88);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const glassVertex = `varying vec3 vWorld;varying vec3 vNormal;varying vec2 vPlane;varying vec4 vScreen;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vNormal=normalize(mat3(modelMatrix)*normal);vPlane=uv*2.-1.;gl_Position=projectionMatrix*viewMatrix*w;vScreen=gl_Position;}`;
const glassFragment = `
uniform sampler2D background;uniform vec2 resolution;uniform float dark;
varying vec3 vWorld,vNormal;varying vec2 vPlane;varying vec4 vScreen;
float roundedRect(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.)+length(max(q,0.))-r;}
void main(){float d=roundedRect(vPlane,vec2(.985),.11);float aa=max(fwidth(d),.002);if(d>aa)discard;vec3 n=normalize(vNormal);vec3 viewDir=normalize(vWorld-cameraPosition);if(dot(viewDir,n)>0.)n=-n;vec3 bend=refract(viewDir,n,1./1.45);vec2 uv=vScreen.xy/vScreen.w*.5+.5;float bevel=1.-smoothstep(0.,.065,abs(d));vec2 offset=bend.xy*.012+n.xy*.007*bevel;vec2 texel=1./resolution;vec3 sampled=texture2D(background,clamp(uv+offset,texel,1.-texel)).rgb*.4;sampled+=texture2D(background,clamp(uv+offset+texel*2.2,texel,1.-texel)).rgb*.15;sampled+=texture2D(background,clamp(uv+offset-texel*2.2,texel,1.-texel)).rgb*.15;sampled+=texture2D(background,clamp(uv+offset+vec2(texel.x,-texel.y)*2.2,texel,1.-texel)).rgb*.15;sampled+=texture2D(background,clamp(uv+offset+vec2(-texel.x,texel.y)*2.2,texel,1.-texel)).rgb*.15;vec3 tint=mix(vec3(.956),vec3(.0027),dark);vec3 edge=mix(vec3(.18,.26,.28),vec3(.26,.38,.39),dark);vec3 c=mix(sampled,tint,.11);c=mix(c,edge,bevel*.42);float facing=1.-abs(dot(-viewDir,n));c+=pow(facing,3.)*.045;gl_FragColor=vec4(c,(1.-smoothstep(-aa,aa,d))*.91);
#include <colorspace_fragment>
}`;
const haloVertex = `varying vec2 vUv;varying float vRelevance;uniform sampler2D cellPositions;uniform vec2 anchorUV,offset;uniform vec3 anchorPosition;uniform float gpu,slice;void main(){vUv=uv;vec3 center=anchorPosition;if(gpu>.5)center=texture2D(cellPositions,anchorUV).xyz;vRelevance=.13+.87*exp(-abs(center.x-slice)*1.6);vec4 mv=viewMatrix*vec4(center,1.);mv.xy+=position.xy+offset;gl_Position=projectionMatrix*mv;}`;
const haloFragment = `varying vec2 vUv;varying float vRelevance;uniform vec3 color;void main(){float d=length(vUv-.5)*2.;float ring=1.-smoothstep(.018,.038,abs(d-.64));float core=1.-smoothstep(.075,.13,d);float haze=exp(-d*d*6.)*.16;float a=(ring*.8+core+haze)*vRelevance;if(a<.008)discard;gl_FragColor=vec4(color,a);
#include <colorspace_fragment>
}`;
const labelFragment=`varying vec2 vUv;varying float vRelevance;uniform sampler2D label;uniform float dark;void main(){float a=texture2D(label,vUv).a;if(a<.02)discard;gl_FragColor=vec4(mix(vec3(.09),vec3(.91),dark),a*(.4+.6*vRelevance));}`;

export function createImmunoEngine(renderer: THREE.WebGLRenderer): ChamberScene {
 const cloud=createCellCloud();
 const owned: Array<{dispose:()=>void}>=[];
 const own=<T extends {dispose:()=>void}>(resource:T):T=>{owned.push(resource);return resource;};
 try {
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(38,1,.1,80);
 const colorLight=new THREE.Color('#FAFAFA'),colorDark=new THREE.Color('#090909');
 const palette=CLUSTER_COLORS.map(c=>new THREE.Color(c));
 let width=1,height=1,pixelRatio=1,disposed=false;
 let mode:ChamberMode='instanced-spring';
 const gl=renderer.getContext();
 const gpuName=(()=>{try {const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):String(gl.getParameter(gl.RENDERER));}catch{return '';}})();
 const software=/swiftshader|llvmpipe|softpipe|software|lavapipe/i.test(gpuName);
 const savedState=()=>({target:renderer.getRenderTarget(),color:renderer.getClearColor(new THREE.Color()),alpha:renderer.getClearAlpha(),auto:renderer.autoClear,viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest(),xr:renderer.xr.enabled});
 const restore=(s:ReturnType<typeof savedState>)=>{renderer.setRenderTarget(s.target);renderer.setViewport(s.viewport);renderer.setScissor(s.scissor);renderer.setScissorTest(s.scissorTest);renderer.setClearColor(s.color,s.alpha);renderer.autoClear=s.auto;renderer.xr.enabled=s.xr;};
 const simScene=new THREE.Scene(),simCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const quadGeometry=own(new THREE.PlaneGeometry(2,2));
 const probeMaterial=own(new THREE.ShaderMaterial({vertexShader:quadVertex,fragmentShader:'void main(){gl_FragColor=vec4(.25,.5,.75,1.);}',depthTest:false,depthWrite:false}));
 const quad=new THREE.Mesh(quadGeometry,probeMaterial);simScene.add(quad);
 const makeTarget=(type:THREE.TextureDataType,w=TEXTURE_SIZE,h=TEXTURE_SIZE)=>own(new THREE.WebGLRenderTarget(w,h,{type,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,stencilBuffer:false}));
 // A real attachment check plus a rendered/read-back sample rejects unusable float paths.
 const probe=(type:THREE.TextureDataType):boolean=>{
  const before=savedState();const target=makeTarget(type,2,2);
  try{renderer.xr.enabled=false;renderer.setScissorTest(false);renderer.setRenderTarget(target);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)return false;renderer.render(simScene,simCamera);const pixels=type===THREE.FloatType?new Float32Array(16):new Uint16Array(16);renderer.readRenderTargetPixels(target,0,0,2,2,pixels);const r=type===THREE.FloatType?pixels[0]:THREE.DataUtils.fromHalfFloat(pixels[0]);return Math.abs(r-.25)<.015;}catch{return false;}finally{restore(before);target.dispose();}
 };
 let dataType:THREE.TextureDataType=THREE.FloatType;
 if(!software){
  const floatExtension=renderer.extensions.has('EXT_color_buffer_float');
  const halfExtension=floatExtension||renderer.extensions.has('EXT_color_buffer_half_float');
  if(floatExtension&&probe(THREE.FloatType)){mode='float-fbo';dataType=THREE.FloatType;}
  else if(halfExtension&&probe(THREE.HalfFloatType)){mode='half-float-fbo';dataType=THREE.HalfFloatType;}
 }
 let positions:THREE.WebGLRenderTarget[]=[],velocities:THREE.WebGLRenderTarget[]=[],active=0;
 let simMaterial:THREE.ShaderMaterial|undefined,pointsMaterial:THREE.ShaderMaterial|undefined;
 const cpuPositions=[cloud.raw.slice(),cloud.raw.slice()];const cpuVelocity=new Float32Array(CELL_COUNT*3);
 const instanceMeshes:THREE.InstancedMesh[]=[];
 const instanceDummy=new THREE.Object3D();
 let cpuActive=0;
 if(mode!=='instanced-spring'){
  const allocationStart=owned.length;let gpuParticles:THREE.Points|undefined;
  try{
   const textureData=(source:Float32Array)=>{const data=new Float32Array(TEXTURE_SIZE*TEXTURE_SIZE*4);for(let i=0;i<CELL_COUNT;i++){data[i*4]=source[i*3];data[i*4+1]=source[i*3+1];data[i*4+2]=source[i*3+2];data[i*4+3]=1;}const t=own(new THREE.DataTexture(data,TEXTURE_SIZE,TEXTURE_SIZE,THREE.RGBAFormat,THREE.FloatType));t.needsUpdate=true;return t;};
   const raw=textureData(cloud.raw),aligned=textureData(cloud.aligned);
   positions=[makeTarget(dataType),makeTarget(dataType)];velocities=[makeTarget(dataType),makeTarget(dataType)];
   simMaterial=own(new THREE.ShaderMaterial({vertexShader:quadVertex,fragmentShader:simulationFragment,depthTest:false,depthWrite:false,uniforms:{positions:{value:raw},velocities:{value:raw},rawTarget:{value:raw},alignedTarget:{value:aligned},dt:{value:0},time:{value:0},standardized:{value:0},motion:{value:1},operation:{value:2}}}));
   quad.material=simMaterial;const before=savedState();
   try{renderer.xr.enabled=false;renderer.setScissorTest(false);for(let i=0;i<2;i++){simMaterial.uniforms.operation.value=2;renderer.setRenderTarget(positions[i]);renderer.render(simScene,simCamera);simMaterial.uniforms.operation.value=3;renderer.setRenderTarget(velocities[i]);renderer.render(simScene,simCamera);}}finally{restore(before);}
   const geometry=own(new THREE.BufferGeometry());const lookup=new Float32Array(CELL_COUNT*2),colors=new Float32Array(CELL_COUNT*3),ids=new Float32Array(CELL_COUNT);
   for(let i=0;i<CELL_COUNT;i++){lookup[i*2]=(i%TEXTURE_SIZE+.5)/TEXTURE_SIZE;lookup[i*2+1]=(Math.floor(i/TEXTURE_SIZE)+.5)/TEXTURE_SIZE;palette[cloud.clusters[i]%palette.length].toArray(colors,i*3);ids[i]=i;}
   geometry.setAttribute('position',new THREE.BufferAttribute(cloud.raw.slice(),3));geometry.setAttribute('lookup',new THREE.BufferAttribute(lookup,2));geometry.setAttribute('cellColor',new THREE.BufferAttribute(colors,3));geometry.setAttribute('cellId',new THREE.BufferAttribute(ids,1));
   pointsMaterial=own(new THREE.ShaderMaterial({vertexShader:particleVertex,fragmentShader:particleFragment,transparent:true,depthWrite:false,uniforms:{positions:{value:positions[0].texture},pixelRatio:{value:1},selected:{value:-1},dark:{value:0}}}));
   gpuParticles=new THREE.Points(geometry,pointsMaterial);gpuParticles.frustumCulled=false;scene.add(gpuParticles);renderer.compile(scene,camera);
  }catch{mode='instanced-spring';if(gpuParticles)scene.remove(gpuParticles);for(const resource of owned.splice(allocationStart))resource.dispose();positions=[];velocities=[];pointsMaterial=undefined;simMaterial=undefined;quad.material=probeMaterial;}
 }
 if(mode==='instanced-spring'){
  const geo=own(new THREE.OctahedronGeometry(.026,0));const mat=own(new THREE.MeshBasicMaterial({transparent:true,opacity:.84}));
  for(let k=0;k<2;k++){const mesh=own(new THREE.InstancedMesh(geo,mat,CELL_COUNT));mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;for(let i=0;i<CELL_COUNT;i++){instanceDummy.position.fromArray(cloud.raw,i*3);instanceDummy.updateMatrix();mesh.setMatrixAt(i,instanceDummy.matrix);mesh.setColorAt(i,palette[cloud.clusters[i]%palette.length]);}mesh.visible=k===0;instanceMeshes.push(mesh);scene.add(mesh);}
 }
 const background=own(new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter}));
 const idleSampler=own(new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1));idleSampler.needsUpdate=true;
 const glassMaterial=own(new THREE.ShaderMaterial({vertexShader:glassVertex,fragmentShader:glassFragment,transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{background:{value:background.texture},resolution:{value:new THREE.Vector2(1,1)},dark:{value:0}}}));
 const glass=new THREE.Mesh(own(new THREE.PlaneGeometry(3.3,4.8)),glassMaterial);glass.rotation.y=Math.PI/2;glass.renderOrder=4;scene.add(glass);
 const haloGeometry=own(new THREE.PlaneGeometry(.4,.4));
 const markerGenes=['FOXP3','CCR7','CD8A','CD8B'];
 const driverIndices=markerGenes.map(gene=>{let best=0,bestWeight=-1;for(let i=0;i<CELL_COUNT;i+=7){const weight=markerWeights(i).find(w=>w.gene===gene)?.weight??0;if(weight>bestWeight){best=i;bestWeight=weight;}}return best;});
 const markerColors=['#B47D88','#83A999','#719DA9','#9A86AF'];
 const labelGeometry=own(new THREE.PlaneGeometry(.72,.18));
 const halos=driverIndices.map((index,i)=>{
  const anchorUniforms={cellPositions:{value:positions[active]?.texture??idleSampler},anchorUV:{value:new THREE.Vector2((index%TEXTURE_SIZE+.5)/TEXTURE_SIZE,(Math.floor(index/TEXTURE_SIZE)+.5)/TEXTURE_SIZE)},anchorPosition:{value:new THREE.Vector3().fromArray(cloud.raw,index*3)},gpu:{value:mode==='instanced-spring'?0:1},slice:{value:0},offset:{value:new THREE.Vector2()}};
  const mat=own(new THREE.ShaderMaterial({vertexShader:haloVertex,fragmentShader:haloFragment,transparent:true,depthTest:false,depthWrite:false,uniforms:{...anchorUniforms,color:{value:new THREE.Color(markerColors[i])}}}));
  const mesh=new THREE.Mesh(haloGeometry,mat);mesh.frustumCulled=false;mesh.renderOrder=5;scene.add(mesh);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');if(ctx){ctx.font='600 36px monospace';ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.fillText(markerGenes[i],10,32);}
  const label=own(new THREE.CanvasTexture(canvas));
  const labelMaterial=own(new THREE.ShaderMaterial({vertexShader:haloVertex,fragmentShader:labelFragment,transparent:true,depthTest:false,depthWrite:false,uniforms:{...anchorUniforms,offset:{value:new THREE.Vector2(.48,.19)},label:{value:label},dark:{value:0}}}));
  const labelMesh=new THREE.Mesh(labelGeometry,labelMaterial);labelMesh.frustumCulled=false;labelMesh.renderOrder=6;scene.add(labelMesh);
  return {mesh,label:labelMesh,index};
 });
 const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();const projected=new THREE.Vector3();const candidate=new THREE.Vector3();
 let yaw=.45,pitch=.12,lastState:ChamberState|undefined;
 const resize=(w:number,h:number,dpr:number)=>{width=Math.max(1,w);height=Math.max(1,h);pixelRatio=Math.min(dpr,2);camera.aspect=width/height;camera.updateProjectionMatrix();background.setSize(Math.max(1,Math.floor(width*pixelRatio)),Math.max(1,Math.floor(height*pixelRatio)));glassMaterial.uniforms.resolution.value.set(background.width,background.height);if(pointsMaterial)pointsMaterial.uniforms.pixelRatio.value=pixelRatio;};
 const frame=(delta:number,elapsed:number,state:ChamberState)=>{
  if(disposed)return;const before=savedState();const dt=Math.min(Math.max(delta,0),.04);lastState=state;
  try{
   renderer.xr.enabled=false;renderer.autoClear=true;renderer.setScissorTest(false);
   const goalYaw=.45+state.cameraYaw+(state.guided&&!state.reducedMotion?Math.sin(elapsed*.075)*.25:0);
   const goalPitch=.12+state.cameraPitch+(state.guided&&!state.reducedMotion?Math.sin(elapsed*.052)*.07:0);
   const damping=state.reducedMotion?1:1.-Math.exp(-dt*3.5);yaw=THREE.MathUtils.lerp(yaw,goalYaw,damping);pitch=THREE.MathUtils.lerp(pitch,THREE.MathUtils.clamp(goalPitch,-.6,.7),damping);
   const distance=camera.aspect<.8?15:11.5;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,0,0);camera.updateMatrixWorld();
   if(mode!=='instanced-spring'&&simMaterial){
    {const next=1-active;const u=simMaterial.uniforms;u.standardized.value=state.standardized?1:0;u.dt.value=dt;u.time.value=elapsed;u.motion.value=state.reducedMotion?0:1;u.positions.value=positions[active].texture;u.velocities.value=velocities[active].texture;u.operation.value=state.reducedMotion?3:0;renderer.setRenderTarget(velocities[next]);renderer.render(simScene,simCamera);u.velocities.value=velocities[next].texture;u.operation.value=state.reducedMotion?2:1;renderer.setRenderTarget(positions[next]);renderer.render(simScene,simCamera);active=next;}
    if(pointsMaterial){pointsMaterial.uniforms.positions.value=positions[active].texture;pointsMaterial.uniforms.selected.value=state.selectedCell;pointsMaterial.uniforms.dark.value=state.dark?1:0;}
   }else{
    const next=1-cpuActive,source=cpuPositions[cpuActive],dest=cpuPositions[next],target=state.standardized?cloud.aligned:cloud.raw;
    for(let i=0;i<CELL_COUNT;i++){const j=i*3;for(let a=0;a<3;a++){const jitter=state.reducedMotion?0:Math.sin(elapsed*.4+source[j+(a+1)%3]*1.7+i*.007)*.025;cpuVelocity[j+a]=state.reducedMotion?0:(cpuVelocity[j+a]+((target[j+a]-source[j+a])*3.8+jitter)*dt)*Math.exp(-2.9*dt);dest[j+a]=state.reducedMotion?target[j+a]:source[j+a]+cpuVelocity[j+a]*dt;}instanceDummy.position.fromArray(dest,j);instanceDummy.scale.setScalar(i===state.selectedCell?1.9:1);instanceDummy.updateMatrix();instanceMeshes[next].setMatrixAt(i,instanceDummy.matrix);}
    instanceMeshes[cpuActive].visible=false;instanceMeshes[next].visible=true;instanceMeshes[next].instanceMatrix.needsUpdate=true;cpuActive=next;
   }
   glass.position.x=state.slice*4;glassMaterial.uniforms.dark.value=state.dark?1:0;
   for(const halo of halos){const u=halo.mesh.material.uniforms;u.anchorPosition.value.fromArray(cpuPositions[cpuActive],halo.index*3);u.cellPositions.value=positions[active]?.texture??idleSampler;u.slice.value=glass.position.x;halo.label.material.uniforms.dark.value=state.dark?1:0;}
   scene.background=state.dark?colorDark:colorLight;
   glass.visible=false;renderer.setRenderTarget(background);renderer.render(scene,camera);
   glass.visible=true;renderer.setRenderTarget(before.target);renderer.setViewport(before.viewport);renderer.render(scene,camera);
  }finally{glass.visible=true;restore(before);}
 };
 const pick=(x:number,y:number):number|null=>{
  if(disposed||!lastState)return null;pointer.set(x,y);raycaster.setFromCamera(pointer,camera);
  if(mode==='instanced-spring'){const hit=raycaster.intersectObject(instanceMeshes[cpuActive],false)[0];if(hit?.instanceId!==undefined)return hit.instanceId;}
  let actual:Float32Array|Uint16Array|undefined;
  if(mode!=='instanced-spring'){const before=savedState();try{actual=dataType===THREE.FloatType?new Float32Array(TEXTURE_SIZE*TEXTURE_SIZE*4):new Uint16Array(TEXTURE_SIZE*TEXTURE_SIZE*4);renderer.readRenderTargetPixels(positions[active],0,0,TEXTURE_SIZE,TEXTURE_SIZE,actual);}catch{return null;}finally{restore(before);}}
  let winner:number|null=null,best=Infinity;const threshold=12/Math.min(width,height);
  for(let i=0;i<CELL_COUNT;i++){if(actual){const j=i*4;const decode=(v:number)=>dataType===THREE.HalfFloatType?THREE.DataUtils.fromHalfFloat(v):v;candidate.set(decode(actual[j]),decode(actual[j+1]),decode(actual[j+2]));}else candidate.fromArray(cpuPositions[cpuActive],i*3);projected.copy(candidate).project(camera);if(projected.z< -1||projected.z>1)continue;const distance=Math.hypot((projected.x-x)*camera.aspect,projected.y-y);if(distance<threshold&&distance<best){best=distance;winner=i;}}
  return winner;
 };
 return {mode,cellCount:CELL_COUNT,resize,frame,pick,dispose:()=>{if(disposed)return;disposed=true;scene.clear();simScene.clear();for(const resource of new Set(owned))resource.dispose();}};
 } catch(error) {
  for(const resource of new Set(owned))resource.dispose();
  throw error;
 }
}
