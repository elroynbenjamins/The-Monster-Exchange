import {content} from '../content/index.ts';
import type {GameState} from './state.ts';
const special=['gloamkit','hushhare','voltgrazer','duneskip','tidepup','burrowseer'] as const;
function activeSpecial(state:GameState){return state.activeExpedition?.route.teamIds.map(id=>[id,state.monsters[id]?.speciesId] as const).filter((x):x is readonly[string,typeof special[number]]=>special.includes(x[1] as typeof special[number]))??[];}
function add(state:GameState,id:string,key:string,amount=1){const p=state.player.specialEvolutionProgress,k=`${id}:${key}`;return {...state,player:{...state.player,specialEvolutionProgress:{...p,[k]:(p[k]??0)+amount}}};}
export function recordBattleEvolutionProgress(before:GameState,after:GameState,result:'player-victory'|'enemy-victory'):GameState{
 let next=after;
 for(const [id,species] of activeSpecial(before)){
  const alive=(after.conditions[id]?.hpRatio??0)>.5;
  if(species==='gloamkit')next=add(next,id,'noFaintStreak',result==='player-victory'&&(after.conditions[id]?.hpRatio??0)>0?1:-(next.player.specialEvolutionProgress[`${id}:noFaintStreak`]??0));
  if(species==='hushhare'&&result==='player-victory'&&alive)next=add(next,id,'healthyBattleFinishes');
 }
 return next;
}
export function recordEncounterEvolutionProgress(state:GameState,capturedSpeciesId?:string):GameState{
 let next=state;const zone=content.zones.find(z=>z.id===state.activeExpedition?.route.zoneId),target=content.species.find(s=>s.id===capturedSpeciesId);
 for(const [id,species] of activeSpecial(state)){
  if(!capturedSpeciesId&&species==='voltgrazer'&&state.player.location.regionId==='stormpeak'&&/storm/i.test(state.world.weatherByRegion.stormpeak??''))next=add(next,id,'stormEncounters');
  if(species==='tidepup'){
   if(!capturedSpeciesId&&zone&&/coast|reef|tide|water/i.test(`${zone.name} ${zone.description}`))next=add(next,id,'coastalDiscoveries');
   if(target&&(target.types.includes('water')&&target.types.includes('rock')||target.tags.some(t=>/reef/i.test(t))))next=add(next,id,'reefCatches');
  }
 }
 return next;
}
export function recordCampEvolutionProgress(state:GameState,nodeType:string):GameState{
 if(nodeType!=='rest')return state;let next=state;
 for(const [id,species] of activeSpecial(state))if(species==='hushhare'&&(state.conditions[id]?.hpRatio??0)>.5)next={...next,player:{...next.player,specialEvolutionProgress:{...next.player.specialEvolutionProgress,[`${id}:campComfortDay`]:state.world.day}}};
 return next;
}
