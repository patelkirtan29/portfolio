import type {BaseChamberState} from './chamberTypes';
export type SibylState=BaseChamberState&{stage:number;baseline:boolean;overlap:number;gpus:number;prefix:number;selected:number;cameraYaw:number;cameraPitch:number};
export const STATUS='In Progress · Qualitative Stage Explorer · No Benchmark Metrics Yet';
export const MINERAL=['#3f6258','#3b526b','#9a4a3a','#6b9080'];
export const STAGES=[
 {title:'Batched indexer',short:'Index',text:'Sibling requests share a long prefix. The proposed batched indexer scores that prefix together, while preserving each sibling’s own top-k selection. The baseline repeats this work for each request.',note:'Own top-k, shared prefix scan'},
 {title:'Union gather',short:'Gather',text:'Selections can overlap. The union gather loads each selected KV block once for the siblings that need it. Watch repeated requests coalesce along curved paths. The overlap dial is an illustrative input, not a measured overlap statistic.',note:'One fetch per unique selected block'},
 {title:'Prefix sharding + LSE merge',short:'Shard',text:'A prefix too long for one GPU can be split across devices. Partial attention results merge exactly through a log-sum-exp reduce-scatter. The white Bessel ripple is a visual metaphor for this merge, not an output or a timing measurement.',note:'Exact partial-result merge'},
 {title:'Overlap-aware scheduler',short:'Schedule',text:'The planned scheduler chooses shard count and KV precision for each group within an accuracy budget. This scene lets you explore configurations qualitatively. No precision policy, accuracy bound, or measured performance is asserted here.',note:'Planned precision and shard policy'},
] as const;
export function normalizeSibyl(input:{stage:number;gpus:number;overlap:number;prefix:number}){const clamp=(n:number,a:number,b:number,f=a)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):f;return {stage:Math.round(clamp(input.stage,0,3)),gpus:Math.round(clamp(input.gpus,1,4)),overlap:clamp(input.overlap,0,1,.6),prefix:Math.round(clamp(input.prefix,65536,1048576))};}
/** Fixed synthetic block identities. Each sibling keeps eight unique selections. */
export function sharedSelections(overlap:number):number[][]{const shared=Math.round(Math.max(0,Math.min(1,Number.isFinite(overlap)?overlap:.6))*8);return Array.from({length:4},(_,s)=>Array.from({length:8},(_,i)=>i<shared?i:8+s*8+i));}
export function unionBlocks(rows:readonly (readonly number[])[]):number[]{return [...new Set(rows.flat())].sort((a,b)=>a-b);}
export function shardBlocks(blocks:readonly number[],gpus:number):number[][]{const count=normalizeSibyl({stage:0,gpus,overlap:0,prefix:65536}).gpus;return Array.from({length:count},(_,s)=>blocks.filter((_,i)=>i%count===s));}
export function mergeAttention(partials:readonly {logNormalizer:number;value:readonly number[]}[]):number[]{if(!partials.length)return [];const max=Math.max(...partials.map(p=>p.logNormalizer));const weights=partials.map(p=>Math.exp(p.logNormalizer-max));const total=weights.reduce((a,b)=>a+b,0);return partials[0]!.value.map((_,i)=>partials.reduce((sum,p,j)=>sum+p.value[i]!*weights[j]!,0)/total);}
export type Point3=[number,number,number];
export const GPU_SLAB_SIZE={width:3.9,depth:.78,height:.28} as const;
/** The same centered surfaces define visible GPU geometry and block routing. */
export function gpuSlabLayout(gpus:number){const count=normalizeSibyl({stage:0,gpus,overlap:0,prefix:65536}).gpus;return Array.from({length:count},(_,index)=>({index,z:(index-(count-1)/2)*1.08,halfWidth:GPU_SLAB_SIZE.width/2,halfDepth:GPU_SLAB_SIZE.depth/2}));}
export function queueTarget(index:number,coalesced:boolean,gpus:number,overlap=.6):Point3{const sibling=Math.floor(index/8),slot=index%8;const block=sharedSelections(overlap)[sibling]![slot]!;if(coalesced){const surfaces=gpuSlabLayout(gpus);return [(block%8-3.5)*.37,.62+Math.floor(block/8)*.13,surfaces[block%surfaces.length]!.z];}return [(slot-3.5)*.37,1.12+sibling*.19,(sibling-1.5)*1.08];}
export function bezierPoint(from:Point3,to:Point3,t:number):Point3{const u=1-t;const c1:Point3=[from[0]-.65,from[1]+1,from[2]];const c2:Point3=[to[0]+.65,to[1]+.85,to[2]];return from.map((v,i)=>u*u*u*v+3*u*u*t*c1[i]!+3*u*t*t*c2[i]!+t*t*t*to[i]!) as Point3;}
