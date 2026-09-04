import {content} from '../content/index.ts';
import {SeededRandom} from '../core/random.ts';
import {generateWildEncounter,attemptCapture,type WildEncounter} from '../systems/encounters.ts';
import {addMonsterToPlayer,recordSpeciesSeen,type GameState} from './state.ts';
import {activeTeamCaptureBonus} from './commands.ts';
import {recordEncounterEvolutionProgress} from './evolution-progress.ts';
export type CaptureCommand={kind:'field-search'|'field-weaken'|'field-throw'|'field-release'};
export interface PendingCapture {encounter:WildEncounter;hp:number;nodeId:string}
export function pendingCapture(s:GameState):PendingCapture|null {const value=s.world.dynamicState['field:pending'];return typeof value==='string'&&value?JSON.parse(value):null;}
export function applyCaptureCommand(s:GameState,c:CaptureCommand):GameState {
 const run=s.activeExpedition,node=run?.route.nodes[run.route.currentNode];
 if(!run||run.route.status!=='active'||!node)throw new Error('Start an active expedition first.');
 const rng=new SeededRandom(s.world.seed+s.world.nextRandomOffset),pending=pendingCapture(s);
 let next=s,save:PendingCapture|null=pending,message='';
 if(c.kind==='field-search'){
  if(pending||s.world.dynamicState['field:lastNode']===node.id)throw new Error('This encounter has already been searched.');
  if(node.type!=='encounter')throw new Error('Search for monsters at an encounter node.');
  const zone=content.zones.find(z=>z.id===run.route.zoneId)!;
  const encounter=generateWildEncounter(zone,content.species,rng,s.world.day,Object.fromEntries(Object.entries(s.player.researchBySpecies).map(([id,r])=>[id,r.level])),{season:s.world.season,weather:s.world.weatherByRegion[zone.regionId],populations:s.world.populations});
  next=recordEncounterEvolutionProgress(recordSpeciesSeen(s,encounter.species.id));save={encounter,hp:1,nodeId:node.id};message='A wild monster appears. Weaken it or throw a Field Capsule.';
 }else{
  if(!pending||pending.nodeId!==node.id)throw new Error('No wild monster is waiting here.');
  if(c.kind==='field-release'){save=null;message='You leave the wild monster safely.';}
  if(c.kind==='field-weaken'){
   if(s.world.dynamicState['field:battle'])throw Error('Use battle actions during combat.');
   if(pending.hp<=.2)throw new Error('The monster is already weakened.');
   const ids=run.route.teamIds;
   if(ids.some(id=>(s.conditions[id]?.stamina??0)<5||(s.conditions[id]?.hpRatio??0)<=0))throw new Error('Your team needs health and 5 stamina each.');
   const conditions={...s.conditions};for(const id of ids)conditions[id]={...conditions[id],stamina:conditions[id].stamina-5};
   next={...s,conditions};save={...pending,hp:Math.max(.2,pending.hp-.4)};message='A controlled field manoeuvre weakens the monster. Each partner spends 5 stamina.';
  }
  if(c.kind==='field-throw'){
   if(s.world.dynamicState['field:battle']){const battle=JSON.parse(String(s.world.dynamicState['field:battle']));if(battle.result!=='ongoing')throw Error('This battle has ended.');}
   if((s.player.inventory['field-capsule']??0)<1)throw new Error('No Field Capsules left.');
   next={...s,player:{...s.player,inventory:{...s.player.inventory,'field-capsule':s.player.inventory['field-capsule']-1}}};
   const result=attemptCapture(pending.encounter,pending.hp,rng,activeTeamCaptureBonus(s,content));
   if(result.captured){next=recordEncounterEvolutionProgress(addMonsterToPlayer(next,pending.encounter.monster),pending.encounter.species.id);save=null;message='Captured! The monster joins your roster.';next={...next,world:{...next.world,storyFlags:[...new Set([...next.world.storyFlags,'STORY_FIELD_CAPTURE'])]}};}else message='The monster escaped the capsule. Try again or leave; the capsule was consumed.';
  }
 }
 const dynamicState:Record<string,string|number|boolean>={...next.world.dynamicState,'field:pending':save?JSON.stringify(save):'','field:lastNode':node.id,'field:message':message};
 if(!save||c.kind==='field-search')delete dynamicState['field:battle'];
 return {...next,world:{...next.world,nextRandomOffset:s.world.nextRandomOffset+1,dynamicState}};
}
