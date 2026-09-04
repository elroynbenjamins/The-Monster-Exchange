import {content} from '../content/index.ts';
import {conductSpeciesStudy,evolveOwnedMonster} from './commands.ts';
import {evaluateEvolution} from '../systems/evolution.ts';
import type {GameState} from './state.ts';
// v47 Evolution Paths U:X. These milestones are earned world events, not client inputs.
export const SPECIAL_EVOLUTION_HINTS:Readonly<Record<string,string>>={
 gloamkit:'Bond 70; five battles without fainting; rest at Home at night.',
 hushhare:'Bond 60; three battles ending above half HP; peaceful camp comfort.',
 voltgrazer:'Three storm-zone encounters; currently in Stormpeak during Thunderstorm.',
 duneskip:'Three charged traversal nodes without fainting; Dry Lightning in Stormpeak or Aurelia.',
 tidepup:'Discover four coastal species and capture two reef or Water/Rock species while active; visit a reef.',
 burrowseer:'Reveal five hidden dig/ruin nodes and witness an Alpha while active; trigger at sunrise.',
};
const SPECIAL_PROGRESS:Readonly<Record<string,readonly [string,string,number][]>>={
 gloamkit:[['bondScore','Bond',70],['noFaintStreak','No-faint battles',5]],hushhare:[['bondScore','Bond',60],['healthyBattleFinishes','Healthy victories',3]],
 voltgrazer:[['stormEncounters','Storm encounters',3]],duneskip:[['chargedTraversalStreak','Charged nodes',3]],
 tidepup:[['coastalDiscoveries','Coastal discoveries',4],['reefCatches','Reef captures',2]],burrowseer:[['hiddenNodes','Hidden nodes',5],['alphaWitnessed','Alpha witnessed',1]],
};
export function specialEvolutionProgress(state:GameState,id:string){const species=state.monsters[id]?.speciesId;return (SPECIAL_PROGRESS[species]??[]).map(([key,label,target])=>({key,label,target,value:Math.min(target,state.player.specialEvolutionProgress[`${id}:${key}`]??0)}));}
export function specialEvolutionReady(state:GameState,id:string):boolean{
 const species=state.monsters[id]?.speciesId,p=state.player.specialEvolutionProgress;
 const n=(key:string)=>p[`${id}:${key}`]??0;
 // Interaction stamps are bound to the current world day, preventing stale triggers.
 const today=(key:string)=>n(key)===state.world.day;
 const region=state.player.location.regionId,weather=state.world.weatherByRegion[region];
 switch(species){
  case 'gloamkit':return n('bondScore')>=70&&n('noFaintStreak')>=5&&today('nightHomeRestDay');
  case 'hushhare':return n('bondScore')>=60&&n('healthyBattleFinishes')>=3&&today('campComfortDay');
  case 'voltgrazer':return n('stormEncounters')>=3&&region==='stormpeak'&&weather==='Thunderstorm';
  case 'duneskip':return n('chargedTraversalStreak')>=3&&['stormpeak','aurelia'].includes(region)&&weather==='Dry Lightning';
  case 'tidepup':return n('coastalDiscoveries')>=4&&n('reefCatches')>=2&&today('reefVisitDay');
  case 'burrowseer':return n('hiddenNodes')>=5&&n('alphaWitnessed')>=1&&today('sunriseDay');
  default:return true;
 }
}
export function evolutionOptions(state:GameState,id:string){
 const monster=state.monsters[id];if(!monster)return [];
 return content.evolutions.filter(e=>e.fromSpeciesId===monster.speciesId).map(e=>({e,check:evaluateEvolution(monster,e,{inventory:state.player.inventory,regionId:state.player.location.regionId,weather:state.world.weatherByRegion[state.player.location.regionId],researchLevel:state.player.researchBySpecies[monster.speciesId]?.level??0,storyMilestoneIds:state.world.storyFlags}),specialReady:specialEvolutionReady(state,id)}));
}
export type ProgressionCommand={kind:'evolve';monsterId:string;evolutionId:string}|{kind:'study';speciesId:string;notes:number};
export function applyProgression(state:GameState,c:ProgressionCommand):GameState{
 if(state.activeExpedition)throw Error('Return from the expedition first.');
 if(c.kind==='study'){
  const known=state.player.discoveryBySpecies[c.speciesId];
  if(known!=='SEEN'&&known!=='CAUGHT')throw Error('Discover this species before studying it.');
  // Shared studies predate the explicit discovery ledger; initialize only confirmed sightings.
  const prepared={...state,player:{...state.player,researchBySpecies:{...state.player.researchBySpecies,[c.speciesId]:state.player.researchBySpecies[c.speciesId]??{level:0,points:0}}}};
  return conductSpeciesStudy(prepared,c.speciesId,c.notes,content);
 }
 if(!state.player.monsterIds.includes(c.monsterId))throw Error('Choose a monster in your roster.');
 if(state.breedingJobs.some(j=>j.parentIds.includes(c.monsterId)))throw Error('Finish nursery duty before evolving.');
 const option=evolutionOptions(state,c.monsterId).find(o=>o.e.id===c.evolutionId);
 if(!option)throw Error('Unknown evolution path for this monster.');
 if(!option.specialReady)throw Error('Complete the special bond, world or field milestones first.');
 return evolveOwnedMonster(state,c.monsterId,option.e,content,{storyMilestoneIds:state.world.storyFlags});
}
