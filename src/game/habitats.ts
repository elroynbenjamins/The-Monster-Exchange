import { GAME_TYPES, type GameType } from '../core/types.ts';
import type { GameState } from './state.ts';
export type EstateSide='left'|'right';
export type HabitatCommand={kind:'expand-land';side:EstateSide}|{kind:'build-habitat';side:EstateSide;type:GameType}|{kind:'upgrade-habitat';type:GameType};
export const landParcels=(s:GameState,side:EstateSide)=>Number(s.world.dynamicState[`estate:${side}`]??0);
export function habitat(s:GameState,type:GameType) {
 const d=s.world.dynamicState,side=d[`habitat:${type}:side`] as EstateSide|undefined;
 const target=Number(d[`habitat:${type}:target`]??0),day=Number(d[`habitat:${type}:day`]??0);
 const complete=s.world.day>=day;
 return {type,side,level:complete?target:Math.max(0,target-1),target,completesOnDay:day,building:!!side&&!complete,slot:Number(d[`habitat:${type}:slot`]??0)};
}
export function habitatCost(level:number){return {crowns:100*level,timber:20*level,stone:10*level,days:level};}
export function applyHabitatCommand(s:GameState,c:HabitatCommand):GameState {
 if(s.activeExpedition) throw new Error('Return from your expedition to manage the estate.');
 const d={...s.world.dynamicState};
 if(c.kind==='expand-land') {
  if(!['left','right'].includes(c.side)) throw new Error('Unknown estate side.');
  const current=landParcels(s,c.side),cost=300*(current+1);
  if(current>=3) throw new Error('This side already has nine habitat plots.');
  if(s.player.crowns<cost) throw new Error('Not enough Crowns for land.');
  d[`estate:${c.side}`]=current+1;
  return {...s,player:{...s.player,crowns:s.player.crowns-cost},world:{...s.world,dynamicState:d}};
 }
 if(!GAME_TYPES.includes(c.type)) throw new Error('Unknown habitat type.');
 const existing=habitat(s,c.type);
 if(c.kind==='build-habitat') {
  if(!['left','right'].includes(c.side)) throw new Error('Unknown estate side.');
  if(existing.side) throw new Error('This habitat already exists.');
  const used=GAME_TYPES.filter(type=>habitat(s,type).side===c.side).length;
  if(used>=landParcels(s,c.side)*3) throw new Error('Expand this side to add habitat plots.');
  d[`habitat:${c.type}:side`]=c.side;d[`habitat:${c.type}:slot`]=used;
 } else if(!existing.side||existing.building||existing.level>=3) throw new Error('Only completed habitats below level three can be upgraded.');
 const target=c.kind==='build-habitat'?1:existing.level+1,cost=habitatCost(target);
 if(s.player.crowns<cost.crowns||(s.homebase.resources.timber??0)<cost.timber||(s.homebase.resources.stone??0)<cost.stone) throw new Error('Not enough Crowns or base materials.');
 d[`habitat:${c.type}:target`]=target;d[`habitat:${c.type}:day`]=s.world.day+cost.days;
 return {...s,player:{...s.player,crowns:s.player.crowns-cost.crowns},homebase:{...s.homebase,resources:{...s.homebase.resources,timber:s.homebase.resources.timber-cost.timber,stone:s.homebase.resources.stone-cost.stone}},world:{...s.world,dynamicState:d}};
}
