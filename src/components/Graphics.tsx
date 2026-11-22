/// <reference types="vite/client" />
import { useEffect, useRef } from 'react';
import './graphics.css';
import { watchAcousticContext } from '../lib/graphicsLifecycle';

const fragment = `#version 300 es
precision highp float;
out vec4 color;
uniform vec2 resolution;
uniform vec2 pointer;
uniform vec2 velocity;
uniform float time;
uniform float dark;
uniform float scroll;
uniform float resonance;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main() {
  vec2 uv=gl_FragCoord.xy/resolution;
  vec2 aspect=vec2(resolution.x/resolution.y,1.);
  vec2 p=(uv-vec2(.72,.52))*aspect;
  p+=pointer*.035+vec2(scroll*.12,scroll*-.08);
  float r=length(p), a=atan(p.y,p.x);
  float wave=sin(a*5.+time*.18)*.012+cos(a*3.-time*.11)*.009;
  wave+=sin(r*28.-time*2.2)*resonance*.014;
  float d=r+wave+sin(p.x*8.+p.y*5.+time*.12)*.008;
  float rings=1.-smoothstep(.012,.038,abs(fract(d*(17.+scroll*2.))-.5));
  float mask=smoothstep(.08,.28,r)*(1.-smoothstep(.7,1.3,r));
  float particles=0.;
  for(int layer=0;layer<3;layer++){
    float depth=float(layer)+1.;
    vec2 cell=p*(30.+depth*9.)+vec2(time*.04/depth,scroll*depth*1.3);
    cell+=velocity*.12/depth;
    vec2 id=floor(cell), local=fract(cell)-.5;
    vec2 offset=vec2(hash(id+depth),hash(id+depth+9.))-.5;
    float star=1.-smoothstep(.015,.065+resonance*.02,length(local-offset*.7));
    particles+=star*step(.76,hash(id+depth*7.))*(.17+depth*.045);
  }
  float edge=mix(.18,1.,smoothstep(.08,.85,uv.x));
  color=vec4(vec3(mix(.08,.91,dark)),(rings*.12*mask+particles)*edge);
}`;

export function AcousticField({ speaking = false, scrollProgress }: { speaking?: boolean; scrollProgress?: number }) {
  const reactive = useRef({ speaking, scrollProgress });
  reactive.current = { speaking, scrollProgress };
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, '#version 300 es\nvoid main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.); }');
    const pixel = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vertex || !pixel) { if(vertex) gl.deleteShader(vertex); if(pixel) gl.deleteShader(pixel); return; }
    const program = gl.createProgram();
    if (!program) { gl.deleteShader(vertex); gl.deleteShader(pixel); return; }
    gl.attachShader(program, vertex); gl.attachShader(program, pixel); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(pixel); return; }
    gl.useProgram(program);
    const uniforms = Object.fromEntries(['resolution','pointer','velocity','time','dark','scroll','resonance'].map(name => [name, gl.getUniformLocation(program, name)]));
    let frame = 0;
    const lifecycle = watchAcousticContext(el, el.parentElement, () => cancelAnimationFrame(frame));
    let clock = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0, vx = 0, vy = 0, voice = 0, depth = 0, previous = 0;
    let visible = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const draw = () => {
      if (!lifecycle.isActive()) return;
      gl.viewport(0,0,el.width,el.height);
      gl.uniform2f(uniforms.resolution,el.width,el.height);
      gl.uniform2f(uniforms.pointer,x,y);
      gl.uniform2f(uniforms.velocity,vx,vy);
      gl.uniform1f(uniforms.resonance,reduced.matches ? 0 : voice);
      gl.uniform1f(uniforms.scroll,depth);
      gl.uniform1f(uniforms.time,clock);
      gl.uniform1f(uniforms.dark, document.documentElement.dataset.theme === 'dark' ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES,0,3);
    };
    const tick = (t: number) => {
      if (!lifecycle.isActive() || !visible) return;
      const dt=previous ? Math.min((t-previous)/16.67,3) : 1; previous=t;
      const ease=1-Math.pow(.9,dt), oldX=x, oldY=y;
      x+=(targetX-x)*ease; y+=(targetY-y)*ease;
      vx+=((x-oldX)*50-vx)*.12; vy+=((y-oldY)*50-vy)*.12;
      voice+=((reactive.current.speaking?1:0)-voice)*.07;
      const targetDepth=reactive.current.scrollProgress ?? window.scrollY/Math.max(1,window.innerHeight);
      depth+=(Math.max(0,Math.min(1,targetDepth))-depth)*.08;
      clock=t/1000; draw(); frame=requestAnimationFrame(tick);
    };
    const resize = () => { if (!lifecycle.isActive()) return; const r=el.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio,2); el.width=Math.max(1,Math.round(r.width*dpr)); el.height=Math.max(1,Math.round(r.height*dpr)); draw(); };
    const motion = () => { cancelAnimationFrame(frame); if (!lifecycle.isActive()) return; previous=0; if(!reduced.matches && visible) frame=requestAnimationFrame(tick); else draw(); };
    const move = (event: PointerEvent) => { if(reduced.matches) return; const r=el.getBoundingClientRect(); targetX=Math.max(-.5,Math.min(.5,(event.clientX-r.left)/Math.max(1,r.width)-.5)); targetY=Math.max(-.5,Math.min(.5,(event.clientY-r.top)/Math.max(1,r.height)-.5)); };
    const observer = new ResizeObserver(resize); observer.observe(el);
    const visibility = new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; motion(); }); visibility.observe(el);
    const theme = new MutationObserver(draw); theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    window.addEventListener('pointermove',move,{passive:true}); reduced.addEventListener('change',motion);
    resize(); motion();
    return () => { lifecycle.dispose(); observer.disconnect(); visibility.disconnect(); theme.disconnect(); window.removeEventListener('pointermove',move); reduced.removeEventListener('change',motion); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(pixel); };
  },[]);
  return <div className="acoustic-field" aria-hidden="true"><div className="acoustic-fallback"/><canvas ref={canvas}/></div>;
}

export function Crest({ small = false, speaking = false }: { small?: boolean; speaking?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0, x=0, y=0, vx=0, vy=0, targetX=0, targetY=0, previous=0;
    const draw=()=>{ el.style.setProperty('--tilt-x',`${x}deg`); el.style.setProperty('--tilt-y',`${y}deg`); };
    const tick=(t:number)=>{
      const dt=previous?Math.min((t-previous)/16.67,2):1; previous=t;
      vx+=(targetX-x)*.045*dt; vy+=(targetY-y)*.045*dt;
      vx*=Math.pow(.76,dt); vy*=Math.pow(.76,dt); x+=vx*dt; y+=vy*dt; draw();
      if(Math.abs(targetX-x)+Math.abs(targetY-y)+Math.abs(vx)+Math.abs(vy)>.015) frame=requestAnimationFrame(tick);
      else {frame=0;previous=0;x=targetX;y=targetY;draw();}
    };
    const start=()=>{if(!frame&&!reduced.matches)frame=requestAnimationFrame(tick);};
    const move=(event:PointerEvent)=>{if(reduced.matches)return;const r=el.getBoundingClientRect();targetX=-(event.clientY-r.top-r.height/2)/r.height*18;targetY=(event.clientX-r.left-r.width/2)/r.width*18;start();};
    const reset=()=>{targetX=targetY=0;start();};
    const motion=()=>{cancelAnimationFrame(frame);frame=0;previous=0;if(reduced.matches){x=y=vx=vy=targetX=targetY=0;draw();}else start();};
    el.addEventListener('pointermove',move); el.addEventListener('pointerleave',reset); reduced.addEventListener('change',motion);
    return()=>{cancelAnimationFrame(frame);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',reset);reduced.removeEventListener('change',motion);};
  },[]);
  return <div ref={root} className={`herald-crest${small?' herald-crest--small':''}${speaking?' is-speaking':''}`} aria-hidden="true">
    <div className="crest-halo crest-halo--one"/><div className="crest-halo crest-halo--two"/>
    <div className="crest-object"><div className="crest-edge"><div className="crest-rim"><div className="crest-grooves"><div className="crest-core">
      <div className="crest-orbit"/><svg className="crest-mark" viewBox="0 0 120 120" fill="none"><path d="M35 27v66M85 27v66M35 60h50" stroke="currentColor" strokeWidth="6"/><path d="M47 39v42M60 31v58M73 39v42" stroke="currentColor" strokeWidth="2"/><path d="M26 31h18M76 31h18M26 89h18M76 89h18" stroke="currentColor" strokeWidth="3"/></svg>
      <span className="crest-inscription">A VOICE. A PRESENCE.</span><span className="crest-star">✦</span>
    </div></div></div></div></div>
  </div>;
}

export function WireSphere({ speaking = false }: { speaking?: boolean }) {
  const activeVoice=useRef(speaking); activeVoice.current=speaking;
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    let frame=0, angle=.35, speed=.003, hover=false, previous=0, visible=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const draw = () => {
      const w=el.width,h=el.height, radius=Math.min(w,h)*.37;
      ctx.clearRect(0,0,w,h);
      const dark=document.documentElement.dataset.theme==='dark';
      const point=(lat:number,lon:number) => {
        const px=Math.cos(lat)*Math.cos(lon), py=Math.sin(lat), pz=Math.cos(lat)*Math.sin(lon);
        const x=px*Math.cos(angle)-pz*Math.sin(angle), z=px*Math.sin(angle)+pz*Math.cos(angle);
        const y=py*Math.cos(-.3)-z*Math.sin(-.3), depth=py*Math.sin(-.3)+z*Math.cos(-.3);
        return {x:w*.5+x*radius,y:h*.5+y*radius,z:depth};
      };
      const line=(latitude:boolean,index:number) => {
        for(let step=0;step<96;step++) {
          const a=step/96*Math.PI*2,b=(step+1)/96*Math.PI*2;
          const p=latitude?point(index,a):point(a,index),q=latitude?point(index,b):point(b,index);
          ctx.strokeStyle=dark?`rgba(225,225,225,${.1+(p.z+1)*.18})`:`rgba(32,32,32,${.09+(p.z+1)*.19})`;
          ctx.lineWidth=Math.max(.65,w/500);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
        }
      };
      for(let i=1;i<12;i++)line(true,-Math.PI/2+i*Math.PI/12);
      for(let i=0;i<14;i++)line(false,i*Math.PI/14);
    };
    const tick=(t:number) => { if(!visible)return; const delta=previous?Math.min((t-previous)/16.67,3):1;previous=t;speed+=((hover?.012:activeVoice.current?.005:.003)-speed)*.04;angle+=speed*delta;draw();frame=requestAnimationFrame(tick); };
    const motion=()=>{cancelAnimationFrame(frame);previous=0;if(!reduced.matches&&visible) frame=requestAnimationFrame(tick);else draw();};
    const resize=()=>{const r=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);el.width=Math.max(1,Math.round(r.width*dpr));el.height=Math.max(1,Math.round(r.height*dpr));draw();};
    const enter=()=>{hover=true;};const leave=()=>{hover=false;};
    const observer=new ResizeObserver(resize);observer.observe(el);
    const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;motion();});visibility.observe(el);
    const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    el.addEventListener('pointerenter',enter);el.addEventListener('pointerleave',leave);reduced.addEventListener('change',motion);
    resize();motion();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();visibility.disconnect();theme.disconnect();el.removeEventListener('pointerenter',enter);el.removeEventListener('pointerleave',leave);reduced.removeEventListener('change',motion);};
  },[]);
  return <canvas ref={canvas} className="wire-sphere" aria-hidden="true"/>;
}
