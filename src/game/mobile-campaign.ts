import { content } from "../content/index.ts";
import { SeededRandom } from "../core/random.ts";
import { createNewGame, type GameState } from "./state.ts";
import { selectStarter, STARTER_SPECIES_IDS, setActiveTeam, equipMonsterItems, equipMonsterSkills, renameOwnedMonster, startBreeding, claimBreedingJob } from "./commands.ts";
import { createMonster } from "../systems/monsters.ts";
import { appraiseMonster, createListing } from "../systems/market.ts";
import { buyListing, cancelPlayerListing, listPlayerMonster } from "../systems/transactions.ts";
import { cityServices, enterMajorCity, travelPlayer } from "./location.ts";
import { advanceWorldDay } from "./world-tick.ts";
import { addMonsterToPlayer } from "./state.ts";
import { craftRecipe, depositHomebaseResource, provideFieldCare, constructBuilding, upgradeBuilding } from './commands.ts';
import { applyHabitatCommand, habitat, type HabitatCommand } from './habitats.ts';
import { GAME_TYPES,type GameType } from '../core/types.ts';
import { startExpeditionRun,resolveExpeditionNode,finishExpedition,calculateExpeditionPreparation,type ExpeditionApproach } from './expedition-run.ts';
import {applyCaptureCommand,pendingCapture,type CaptureCommand} from './field-capture.ts';
import {applyFieldBattle,type FieldBattleCommand} from './field-battle.ts';
import {applyProgression,type ProgressionCommand} from './native-progression.ts';
import {recordCampEvolutionProgress} from './evolution-progress.ts';
import {acceptContract,abandonContract,claimContract,recordContractProgress} from './contracts.ts';
import {challengeTrainer,initializeTrainers} from '../systems/trainers.ts';
import {bondWithCrestGuardian,type CrestGuardianId} from '../content/crest-guardians.ts';

export const MOBILE_STORY = { metGuide: "STORY_MET_TESSA", fieldLesson: "STORY_FIELD_LESSON", firstCapture: "STORY_FIRST_CAPTURE", market: "STORY_EXCHANGE_UNLOCKED", starters: "STORY_STARTER_TRADING_UNLOCKED" } as const;

export type MobileCommand =
  | HabitatCommand
  | CaptureCommand
  | FieldBattleCommand
  | ProgressionCommand
  | {kind:'breed';parentIds:[string,string];habitatType?:GameType}
  | {kind:'hatch';jobId:string}
  | {kind:'equip';monsterId:string;equipmentIds:string[]}
  | {kind:'skills';monsterId:string;skillIds:string[]}
  | {kind:'rename';monsterId:string;nickname:string}
  | {kind:'claim-field-quest'}
  | {kind:'contract-accept';definitionId:string}
  | {kind:'contract-claim';definitionId:string}
  | {kind:'contract-abandon';definitionId:string}
  | {kind:'trainer-challenge';trainerId:string}
  | {kind:'guardian-bond';speciesId:CrestGuardianId}
  | {kind:'expedition-start';zoneId:string}
  | {kind:'expedition-step';approach:ExpeditionApproach}
  | {kind:'expedition-return';retreat:boolean}
  | { kind: "travel"; routeId: string }
  | { kind: "buy"; listingId: string }
  | { kind: "list"; monsterId: string; price: number }
  | { kind: "cancel"; listingId: string }
  | { kind: "team"; monsterIds: string[] }
  | { kind: "story"; step: "meet-guide" | "field-lesson" | "tutorial-capture" }
  | { kind: "build"; buildingId: string }
  | { kind: "upgrade"; buildingId: string }
  | { kind: 'deposit'; resourceId: string; amount: number }
  | { kind: 'craft'; recipeId: string }
  | { kind: 'care'; monsterId: string }
  | { kind: 'expand-base' }
  | { kind: 'claim-foundation' }
  | { kind: "rest" };
// Invalidate replay saves when engine rules change; content fingerprint handles database edits.
const rules = `native-1:${JSON.stringify(content).split("").reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)}`;
export interface CampaignSetup { name: string; seed: number; starter: string }
export interface CampaignRecord { version: 1; rules: string; setup: CampaignSetup; commands: MobileCommand[] }

export function createMobileCampaign(setup: CampaignSetup): GameState {
  if (typeof setup?.name !== "string" || setup.name.length > 40 || !Number.isInteger(setup.seed) || setup.seed < 0 || setup.seed > 0xffffffff) throw new Error("Invalid profile details.");
  const rng = new SeededRandom(setup.seed);
  let state = selectStarter(createNewGame(setup.name, setup.seed, content.contentVersion), setup.starter, content, rng);
  // Protected preview stock retained for deterministic compatibility with existing native saves.
  const listings = STARTER_SPECIES_IDS.map(id => {
    const species = content.species.find(item => item.id === id)!;
    const monster = createMonster(species, rng, { ownerId: "npc-willow-exchange", day: 1, level: 3 });
    return createListing(monster, monster.ownerId!, appraiseMonster(monster, species, content.traits), 1, 4, rng);
  });
  return { ...state, market: { ...state.market, listings } };
}

export function applyMobileCommand(state: GameState, command: MobileCommand): GameState {
  if (!command || typeof command !== "object") throw new Error("Invalid action.");
  if (["buy", "list", "cancel"].includes(command.kind)) {
    const city = state.player.location.cityId;
    if (!city || !cityServices(city).includes("market")) throw new Error("Visit a city Exchange to trade.");
    if (!state.world.storyFlags.includes(MOBILE_STORY.market)) throw new Error("Complete Tessa's field lesson to unlock the Exchange.");
  }
  switch (command.kind) {
    case 'evolve':case 'study':return applyProgression(state,command);
    case 'field-battle-start':case 'field-battle-turn':return applyFieldBattle(state,command);
    case 'breed': {
      if(!Array.isArray(command.parentIds)||command.parentIds.length!==2||command.parentIds.some(id=>!state.player.monsterIds.includes(id)))throw new Error('Choose two parents from your roster.');
      if(state.breedingJobs.some(job=>job.parentIds.some(id=>command.parentIds.includes(id))))throw new Error('A parent is already caring for another egg.');
      if(command.habitatType){
        if(!GAME_TYPES.includes(command.habitatType))throw new Error('Unknown habitat type.');
        const h=habitat(state,command.habitatType);
        if(!h.side||h.building||h.level<1)throw new Error('Complete this habitat first.');
        if(command.parentIds.some(id=>!content.species.find(s=>s.id===state.monsters[id].speciesId)!.types.includes(command.habitatType)))throw new Error('Both parents must match the habitat type.');
        const used=state.breedingJobs.filter(job=>state.world.dynamicState[`breeding:habitat:${job.id}`]===command.habitatType).length;
        if(used>=h.level)throw new Error('This habitat has no free nursery places.');
      }
      const next=startBreeding(state,command.parentIds,content,new SeededRandom(state.world.seed+state.world.nextRandomOffset));
      const job=next.breedingJobs[next.breedingJobs.length-1];
      return {...next,world:{...next.world,nextRandomOffset:state.world.nextRandomOffset+1,dynamicState:{...next.world.dynamicState,[`breeding:habitat:${job.id}`]:command.habitatType??'central'}}};
    }
    case 'hatch': {
      const next=claimBreedingJob(state,command.jobId,content,new SeededRandom(state.world.seed+state.world.nextRandomOffset));
      const dynamicState={...next.world.dynamicState};delete dynamicState[`breeding:habitat:${command.jobId}`];
      dynamicState['breeding:lastHatch']=next.player.monsterIds[next.player.monsterIds.length-1];
      return {...next,world:{...next.world,nextRandomOffset:state.world.nextRandomOffset+1,dynamicState}};
    }
    case 'equip': {
      if(!Array.isArray(command.equipmentIds)||!state.player.monsterIds.includes(command.monsterId))throw new Error('Choose equipment for a monster in your roster.');
      return equipMonsterItems(state,command.monsterId,command.equipmentIds,content);
    }
    case 'skills': {
      if(!Array.isArray(command.skillIds))throw new Error('Choose a valid skill loadout.');
      return equipMonsterSkills(state,command.monsterId,command.skillIds);
    }
    case 'rename':return renameOwnedMonster(state,command.monsterId,command.nickname);
    case 'field-search':case 'field-weaken':case 'field-release':return applyCaptureCommand(state,command);
    case 'field-throw': {
      const before=new Set(state.player.monsterIds),next=applyCaptureCommand(state,command);
      const capturedId=next.player.monsterIds.find(id=>!before.has(id));
      return capturedId?recordContractProgress(next,{type:'capture-species',targetId:next.monsters[capturedId]!.speciesId},content):next;
    }
    case 'claim-field-quest': {
      if(!state.world.storyFlags.includes('STORY_FIELD_CAPTURE')||!state.world.storyFlags.includes('STORY_EXPEDITION_COMPLETE'))throw new Error('Capture a wild monster and complete an expedition first.');
      if(state.world.storyFlags.includes('STORY_FIELD_QUEST_CLAIMED'))throw new Error('Reward already claimed.');
      return {...state,player:{...state.player,crowns:state.player.crowns+150,inventory:{...state.player.inventory,'field-capsule':(state.player.inventory['field-capsule']??0)+3}},world:{...state.world,storyFlags:[...state.world.storyFlags,'STORY_FIELD_QUEST_CLAIMED']}};
    }
    case 'contract-accept':return acceptContract(state,command.definitionId,content);
    case 'contract-claim':return claimContract(state,command.definitionId,content);
    case 'contract-abandon':return abandonContract(state,command.definitionId);
    case 'trainer-challenge': {
      if(!state.player.location.cityId)throw new Error('Visit a city arena before challenging a trainer.');
      const initialized=state.trainers[command.trainerId]?state:initializeTrainers(state,content,new SeededRandom(state.world.seed+700000+state.world.day));
      const result=challengeTrainer(initialized,command.trainerId,content,new SeededRandom(state.world.seed+state.world.nextRandomOffset));
      return {...result.state,world:{...result.state.world,nextRandomOffset:state.world.nextRandomOffset+1,dynamicState:{...result.state.world.dynamicState,'arena:lastResult':result.playerWon?'Victory':'Defeat','arena:lastReward':result.rewardCrowns,'arena:lastTurns':result.turns}}};
    }
    case 'guardian-bond': {
      if(!['aurevine','tempestyr'].includes(command.speciesId))throw new Error('Unknown Crest Guardian.');
      const requiredRegion=command.speciesId==='aurevine'?'greenreach':'stormpeak';
      if(state.player.location.regionId!==requiredRegion)throw new Error(`Visit the Guardian sanctuary in ${requiredRegion}.`);
      const next=bondWithCrestGuardian(state,command.speciesId,content,new SeededRandom(state.world.seed+state.world.nextRandomOffset));
      return {...next,world:{...next.world,nextRandomOffset:state.world.nextRandomOffset+1,storyFlags:[...new Set([...next.world.storyFlags,`STORY_GUARDIAN_${command.speciesId.toUpperCase()}`])]}};
    }
    case 'expedition-start': {
      if(state.breedingJobs.some(job=>job.parentIds.some(id=>state.player.activeTeamIds.includes(id))))throw new Error('Remove nursery parents from the active team before departure.');
      const zone=content.zones.find(z=>z.id===command.zoneId);
      if(!zone||!state.world.unlockedZoneIds.includes(zone.id)||zone.regionId!==state.player.location.regionId) throw new Error('Travel to an unlocked zone in your current region first.');
      if(!state.world.storyFlags.includes(MOBILE_STORY.firstCapture)) throw new Error('Complete the capture tutorial first.');
      const next=startExpeditionRun(state,zone,new SeededRandom(state.world.seed+state.world.nextRandomOffset));
      return {...next,world:{...next.world,nextRandomOffset:next.world.nextRandomOffset+1}};
    }
    case 'expedition-step': {
      if(pendingCapture(state))throw new Error('Catch or release the wild monster before continuing.');
      if(!['cautious','balanced','bold'].includes(command.approach)) throw new Error('Unknown approach.');
      const zone=content.zones.find(z=>z.id===state.activeExpedition?.route.zoneId);
      if(!zone) throw new Error('No active expedition.');
      const preparation=calculateExpeditionPreparation(state,zone,content.species,content.hazards);
      const result=resolveExpeditionNode(state,new SeededRandom(state.world.seed+state.world.nextRandomOffset),content.equipment,command.approach,preparation.riskReduction,zone);
      const progressed=recordCampEvolutionProgress(result.state,result.event.payload.nodeType);
      return {...progressed,world:{...progressed.world,nextRandomOffset:state.world.nextRandomOffset+1,dynamicState:{...state.world.dynamicState,'expedition:lastMessage':result.event.payload.message}}};
    }
    case 'expedition-return': {
      const zoneId=state.activeExpedition?.route.zoneId,completed=!command.retreat&&state.activeExpedition?.route.status==='completed';
      let next=finishExpedition(state,command.retreat);
      if(completed&&zoneId){next=recordContractProgress(next,{type:'complete-expedition',targetId:zoneId},content);next=recordContractProgress(next,{type:'defeat-boss'},content);}
      return {...next,world:{...next.world,storyFlags:command.retreat?next.world.storyFlags:[...new Set([...next.world.storyFlags,'STORY_EXPEDITION_COMPLETE'])],dynamicState:{...next.world.dynamicState,'field:pending':''}}};
    }
    case 'expand-land': case 'build-habitat': case 'upgrade-habitat': return applyHabitatCommand(state,command);
    case 'deposit': return depositHomebaseResource(state,command.resourceId,command.amount);
    case 'craft': return craftRecipe(state,command.recipeId,1,content);
    case 'care': return provideFieldCare(state,command.monsterId,1);
    case 'expand-base': {
      if(state.activeExpedition) throw new Error('Return from the expedition first.');
      if(state.homebase.slotCount>=5) throw new Error('All five facility plots are unlocked.');
      const price=200*(state.homebase.slotCount-2);
      if(state.player.crowns<price) throw new Error('Not enough Crowns.');
      return {...state,player:{...state.player,crowns:state.player.crowns-price},homebase:{...state.homebase,slotCount:state.homebase.slotCount+1}};
    }
    case 'claim-foundation': {
      if(!state.world.storyFlags.includes(MOBILE_STORY.firstCapture)||!state.homebase.buildings.some(b=>b.status==='active')) throw new Error('Complete the capture lesson and finish a facility first.');
      if(state.world.storyFlags.includes('STORY_FOUNDATION_REWARD')) throw new Error('Reward already claimed.');
      return {...state,homebase:{...state.homebase,resources:{...state.homebase.resources,timber:(state.homebase.resources.timber??0)+40,stone:(state.homebase.resources.stone??0)+20,herbs:(state.homebase.resources.herbs??0)+15}},world:{...state.world,storyFlags:[...state.world.storyFlags,'STORY_FOUNDATION_REWARD']}};
    }
    case "travel": {
      const next=enterMajorCity(travelPlayer(state, command.routeId, content));
      return next.player.location.regionId==='stonehollow'&&!next.world.storyFlags.includes(MOBILE_STORY.starters) ? {...next,world:{...next.world,storyFlags:[...next.world.storyFlags,MOBILE_STORY.starters]}} : next;
    }
    case "buy": {
      const listing=state.market.listings.find(item=>item.id===command.listingId);
      if(listing&&STARTER_SPECIES_IDS.includes(listing.monster.speciesId as typeof STARTER_SPECIES_IDS[number])&&!state.world.storyFlags.includes(MOBILE_STORY.starters)) throw new Error("Starter species are protected until the Stonehollow chapter.");
      return buyListing(state, command.listingId, content.species);
    }
    case "cancel": return cancelPlayerListing(state, command.listingId);
    case "rest": {
      if(state.activeExpedition) throw new Error('Return from your expedition before resting at home.');
      return advanceWorldDay(state, content).state;
    }
    case "team": return setActiveTeam(state, command.monsterIds);
    case "story": {
      if(!['meet-guide','field-lesson','tutorial-capture'].includes(command.step)) throw new Error('Unknown story step.');
      const has=(flag:string)=>state.world.storyFlags.includes(flag);
      if(command.step==='meet-guide') {
        if(has(MOBILE_STORY.metGuide)) throw new Error("This story step is complete.");
        return {...state,world:{...state.world,storyFlags:[...state.world.storyFlags,MOBILE_STORY.metGuide]}};
      }
      if(command.step==='field-lesson') {
        if(!has(MOBILE_STORY.metGuide)||has(MOBILE_STORY.fieldLesson)) throw new Error("Meet Tessa before beginning the field lesson.");
        return {...state,world:{...state.world,storyFlags:[...state.world.storyFlags,MOBILE_STORY.fieldLesson]}};
      }
      if(!has(MOBILE_STORY.fieldLesson)||has(MOBILE_STORY.firstCapture)) throw new Error("Complete the field lesson before catching a monster.");
      if((state.player.inventory['field-capsule']??0)<1) throw new Error("You need a Field Capsule.");
      const species=content.species.find(item=>item.id==='mossveil')!;
      const fieldRng=new SeededRandom(state.world.seed+state.world.nextRandomOffset);
      const generated=createMonster(species,fieldRng,{ownerId:state.player.id,day:state.world.day,level:3});
      const monster={...generated,id:`tutorial-${generated.id}`};
      const captured=addMonsterToPlayer(state,monster,true);
      const openingSpecies=content.species.filter(item=>!STARTER_SPECIES_IDS.includes(item.id as typeof STARTER_SPECIES_IDS[number])&&item.evolutionStage===1&&item.obtainability?.tradeable!==false).slice(0,5);
      const listings=openingSpecies.map(item=>{const offer=createMonster(item,fieldRng,{ownerId:'npc-willow-exchange',day:state.world.day,level:3});return createListing(offer,offer.ownerId!,appraiseMonster(offer,item,content.traits),state.world.day,4,fieldRng)});
      const discovery={...captured.player.discoveryBySpecies};
      for(const offer of listings) if(!discovery[offer.monster.speciesId]) discovery[offer.monster.speciesId]='SEEN';
      const tutorialResult={...captured,market:{...captured.market,listings},player:{...captured.player,discoveryBySpecies:discovery,inventory:{...captured.player.inventory,'field-capsule':captured.player.inventory['field-capsule']-1}},world:{...captured.world,nextRandomOffset:captured.world.nextRandomOffset+1,storyFlags:[...captured.world.storyFlags,MOBILE_STORY.firstCapture,MOBILE_STORY.market]}};
      return recordContractProgress(tutorialResult,{type:'capture-species',targetId:'mossveil'},content);
    }
    case "build": {
      const definition=content.buildings.find(item=>item.id===command.buildingId); if(!definition) throw new Error("Unknown facility.");
      return constructBuilding(state,definition);
    }
    case "upgrade": {
      const definition=content.buildings.find(item=>item.id===command.buildingId); if(!definition) throw new Error("Unknown facility.");
      return upgradeBuilding(state,definition);
    }
    case "list": {
      if(state.breedingJobs.some(job=>job.parentIds.includes(command.monsterId)))throw new Error('Hatch the egg before listing its parent.');
      const next = listPlayerMonster(state, command.monsterId, command.price, 3, new SeededRandom(state.world.seed + state.world.nextRandomOffset), content.species);
      return { ...next, world: { ...next.world, nextRandomOffset: next.world.nextRandomOffset + 1 } };
    }
    default: throw new Error("Unknown action.");
  }
}
export function newCampaignRecord(setup: CampaignSetup): CampaignRecord {
  createMobileCampaign(setup);
  return { version: 1, rules, setup, commands: [] };
}
export function restoreCampaign(text: string): { record: CampaignRecord; state: GameState } {
  if (text.length > 500000) throw new Error("Save is too large.");
  const record = JSON.parse(text) as CampaignRecord;
  if (!record || record.version !== 1 || record.rules !== rules || !Array.isArray(record.commands) || record.commands.length > 1000) throw new Error("Save cannot be opened by this game version. Your data has been kept.");
  let state = createMobileCampaign(record.setup);
  // Saves made before the story gate retain trading access and their deterministic listing IDs.
  const firstTrade=record.commands.findIndex(command=>command&&['buy','list','cancel'].includes(command.kind));
  const firstCapture=record.commands.findIndex(command=>command?.kind==='story'&&command.step==='tutorial-capture');
  if(firstTrade>=0&&(firstCapture<0||firstTrade<firstCapture)) state={...state,world:{...state.world,storyFlags:[...state.world.storyFlags,MOBILE_STORY.market,MOBILE_STORY.starters]}};
  for (const command of record.commands) state = applyMobileCommand(state, command);
  return { record, state };
}

export interface DeviceStorage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> }
export const CAMPAIGN_KEY = "monster-exchange.native-campaign.v1";
/** Commit to device storage before publishing state. Failure leaves the playable state unchanged. */
export class MobileCampaignStore {
  private busy = false;
  record: CampaignRecord;
  state: GameState;
  private storage: DeviceStorage;
  constructor(record: CampaignRecord, state: GameState, storage: DeviceStorage) {
    this.record = record; this.state = state; this.storage = storage;
  }
  async dispatch(command: MobileCommand): Promise<GameState> {
    if (this.busy) throw new Error("Please wait for the current action to save.");
    if (this.record.commands.length >= 1000) throw new Error("This early build has reached its save turn limit. Your progress is preserved.");
    this.busy = true;
    try {
      const safeCommand = JSON.parse(JSON.stringify(command)) as MobileCommand;
      const next = applyMobileCommand(this.state, safeCommand);
      const record = { ...this.record, commands: [...this.record.commands, safeCommand] };
      await this.storage.setItem(CAMPAIGN_KEY, JSON.stringify(record));
      this.record = record; this.state = next;
      return next;
    } finally { this.busy = false; }
  }
}
