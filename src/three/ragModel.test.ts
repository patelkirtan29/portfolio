import {describe,it,expect} from 'vitest';
import {createCable,stepCable,cableTension,breakCable,reconnectCable,createRagState,severSocket,reconnectSocket,advanceQuery,reapIdle,filterMatches} from './ragModel';

describe('session boundary',()=>{
 it('keeps the same in-flight query after a sever and reconnect',()=>{const initial=createRagState();const cut=severSocket(initial);const working=advanceQuery(cut,2);const joined=reconnectSocket(working);expect(cut.connected).toBe(false);expect(working.progress).toBeGreaterThan(initial.progress);expect(joined.queryId).toBe(initial.queryId);expect(joined.progress).toBe(working.progress);expect(joined.connected).toBe(true);});
 it('reaps only idle disconnected sessions at ten minutes',()=>{const state=createRagState();expect(reapIdle({...state,connected:false,progress:.5},11).primaryReaped).toBe(false);expect(reapIdle({...state,connected:false,progress:1},9.9).primaryReaped).toBe(false);expect(reapIdle({...state,connected:false,progress:1},10).primaryReaped).toBe(true);expect(reapIdle({...state,progress:1},12).primaryReaped).toBe(false);expect(reapIdle(state,10).idleReaped).toBe(true);});
 it('filters illustrative similarities inclusively',()=>{expect(filterMatches(.8).map(x=>x.score)).toEqual([.94,.86]);expect(filterMatches(1)).toEqual([]);});
 it('starts the primary idle clock only when the query becomes idle',()=>{const running=reapIdle(severSocket(createRagState()),12);const complete=advanceQuery(running,100);expect(complete.progress).toBe(1);expect(complete.idleMinutes).toBe(0);expect(complete.primaryReaped).toBe(false);expect(reapIdle(complete,10).primaryReaped).toBe(true);});
});
describe('Verlet socket tether',()=>{
 it('clamps long frames and pins both ends',()=>{const a=createCable([0,0,0],[2,0,0]),b=createCable([0,0,0],[2,0,0]);stepCable(a,5,[0,0,0],[2,0,0]);stepCable(b,.033,[0,0,0],[2,0,0]);expect(a.points).toEqual(b.points);expect(a.points[0]).toEqual([0,0,0]);expect(a.points.at(-1)).toEqual([2,0,0]);});
 it('detects tension, releases the free end, then attaches the registry',()=>{const cable=createCable([0,0,0],[2,0,0]);expect(cableTension(cable,[5,0,0])).toBeGreaterThan(1.65);breakCable(cable);stepCable(cable,.02,[0,0,0],[2,0,0]);expect(cable.connected).toBe(false);expect(cable.points.at(-1)).not.toEqual([2,0,0]);reconnectCable(cable,[1,1,0],[2,0,0]);expect(cable.connected).toBe(true);expect(cable.points[0]).toEqual([1,1,0]);expect(cable.points.at(-1)).toEqual([2,0,0]);});
});
