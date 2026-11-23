import {describe,it,expect} from 'vitest';
import {sharedSelections,unionBlocks,shardBlocks,mergeAttention,queueTarget,bezierPoint,normalizeSibyl,gpuSlabLayout,STAGES,STATUS} from './sibylModel';
describe('SibylKV conceptual model',()=>{
 it('shares overlapping blocks without changing each sibling top-k',()=>{for(const overlap of [0,.3,1]){const rows=sharedSelections(overlap);expect(rows).toHaveLength(4);for(const row of rows)expect(new Set(row).size).toBe(8);const union=unionBlocks(rows);expect(union.length).toBeLessThanOrEqual(32);expect(union.length).toBeGreaterThanOrEqual(8);for(const row of rows)for(const block of row)expect(union).toContain(block);}expect(unionBlocks(sharedSelections(1))).toHaveLength(8);expect(unionBlocks(sharedSelections(0))).toHaveLength(32);});
 it('shards a union once with no lost or duplicate blocks',()=>{for(const count of [1,2,3,4]){const union=unionBlocks(sharedSelections(.5));const shards=shardBlocks(union,count);expect(shards).toHaveLength(count);expect(shards.flat().sort((a,b)=>a-b)).toEqual([...union].sort((a,b)=>a-b));expect(Math.max(...shards.map(s=>s.length))-Math.min(...shards.map(s=>s.length))).toBeLessThanOrEqual(1);}});
 it('merges partial attention stably using log-sum-exp weights',()=>{expect(mergeAttention([{logNormalizer:1000,value:[1,3]},{logNormalizer:1000,value:[3,5]}])).toEqual([2,4]);expect(mergeAttention([{logNormalizer:0,value:[2]},{logNormalizer:-10000,value:[99]}])).toEqual([2]);expect(mergeAttention([])).toEqual([]);});
 it('places every coalesced block over an active centered GPU surface for 1–4 GPUs',()=>{
  for(const count of [1,2,3,4]){
   const surfaces=gpuSlabLayout(count);
   expect(surfaces).toHaveLength(count);
   expect(surfaces.reduce((sum,surface)=>sum+surface.z,0)).toBeCloseTo(0);
   for(const overlap of [0,.5,1])for(let index=0;index<32;index++){
    const target=queueTarget(index,true,count,overlap);
    const covered=surfaces.filter(surface=>Math.abs(target[2]-surface.z)+.11<=surface.halfDepth);
    expect(covered).toHaveLength(1);
    expect(Math.abs(target[0])+.11).toBeLessThanOrEqual(covered[0]!.halfWidth);
   }
  }
  expect(gpuSlabLayout(1)[0]!.z).toBe(0);
  expect(gpuSlabLayout(2).map(surface=>surface.z)).toEqual([-.54,.54]);
 });
 it('has finite continuous transition endpoints and separated baseline requests',()=>{const a=queueTarget(0,false,2),b=queueTarget(0,true,2);expect(bezierPoint(a,b,0)).toEqual(a);expect(bezierPoint(a,b,1)).toEqual(b);expect(queueTarget(0,false,2)).not.toEqual(queueTarget(8,false,2));expect(queueTarget(0,true,2)).toEqual(queueTarget(8,true,2));for(let t=0;t<=1;t+=.05)expect(bezierPoint(a,b,t).every(Number.isFinite)).toBe(true);});
 it('clamps external state and preserves research boundaries',()=>{expect(normalizeSibyl({stage:99,gpus:9,overlap:NaN,prefix:0})).toEqual({stage:3,gpus:4,overlap:.6,prefix:65536});expect(STAGES).toHaveLength(4);expect(STATUS).toBe('In Progress · Qualitative Stage Explorer · No Benchmark Metrics Yet');});
});
